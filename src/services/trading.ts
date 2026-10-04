import { accountStorage, getAccountEpoch } from './accountStorage';
import { PortfolioItem, Stock } from "../types";
import { marketApi } from "./marketApi";

const getPortfolioKey = () => 'portfolio';
const getCashKey = () => 'cash';
const getLeverageKey = () => 'leverage';
const getCurrencyKey = () => 'currency';
const getSandboxInitKey = () => 'sandbox_initialized';

const INITIAL_PORTFOLIO: PortfolioItem[] = [];
const INITIAL_CASH = 1000000; // Starting with ₹10,00,000 cash balance

export const TradingService = {
  getLeverage(): number {
    const key = getLeverageKey();
    const stored = accountStorage().getItem(key);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1; // Default 1x
  },

  setLeverage(leverage: number) {
    accountStorage().setItem(getLeverageKey(), leverage.toString());
    this.notifyChange();
  },

  getCurrency(): string {
    const key = getCurrencyKey();
    return accountStorage().getItem(key) || "INR";
  },

  setCurrency(currency: string) {
    accountStorage().setItem(getCurrencyKey(), currency);
    this.notifyChange();
  },

  getPortfolio(): PortfolioItem[] {
    const key = getPortfolioKey();
    const stored = accountStorage().getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return INITIAL_PORTFOLIO;
      }
    }
    accountStorage().setItem(key, JSON.stringify(INITIAL_PORTFOLIO));
    return INITIAL_PORTFOLIO;
  },

  getCash(): number {
    const key = getCashKey();
    const stored = accountStorage().getItem(key);
    if (stored) {
      const parsed = parseFloat(stored);
      return isNaN(parsed) ? INITIAL_CASH : parsed;
    }
    accountStorage().setItem(key, INITIAL_CASH.toString());
    return INITIAL_CASH;
  },

  setPortfolio(portfolio: PortfolioItem[]) {
    accountStorage().setItem(getPortfolioKey(), JSON.stringify(portfolio));
    this.notifyChange();
  },

  setCash(cash: number) {
    accountStorage().setItem(getCashKey(), cash.toString());
    this.notifyChange();
  },

  isSandboxInitialized(): boolean {
    const key = getSandboxInitKey();
    return accountStorage().getItem(key) === "true";
  },

  setSandboxInitialized(initialized: boolean) {
    accountStorage().setItem(getSandboxInitKey(), initialized ? "true" : "false");
    this.notifyChange();
  },

  resetAccount() {
    accountStorage().setItem(getPortfolioKey(), JSON.stringify(INITIAL_PORTFOLIO));
    accountStorage().setItem(getCashKey(), INITIAL_CASH.toString());
    accountStorage().setItem(getLeverageKey(), "1");
    accountStorage().setItem(getCurrencyKey(), "INR");
    accountStorage().setItem(getSandboxInitKey(), "false");
    this.notifyChange();
  },

  notifyChange() {
    window.dispatchEvent(new CustomEvent("aura_portfolio_updated"));
  },

  updatePortfolioPrices(stocks: Stock[]): PortfolioItem[] {
    const portfolio = this.getPortfolio();
    let updated = false;
    const newPortfolio = portfolio.map(item => {
      const liveStock = stocks.find(s => s.symbol.toUpperCase() === item.symbol.toUpperCase());
      if (liveStock && liveStock.price !== item.currentPrice) {
        updated = true;
        return {
          ...item,
          currentPrice: liveStock.price
        };
      }
      return item;
    });

    if (updated) {
      accountStorage().setItem(getPortfolioKey(), JSON.stringify(newPortfolio));
    }
    return newPortfolio;
  },

  async buyStock(symbol: string, amount: number): Promise<{ success: boolean; message: string }> {
    const ownerEpoch = getAccountEpoch();
    const cleanSymbol = symbol.toUpperCase();
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please enter a valid amount of shares/contracts." };
    }

    // Get current stock price
    const stock = await marketApi.getStockBySymbol(cleanSymbol);
    if (ownerEpoch !== getAccountEpoch()) return { success: false, message: 'Account changed. Please try again.' };
    if (!stock) {
      return { success: false, message: `Asset with symbol ${cleanSymbol} not found.` };
    }

    const price = stock.price;
    const totalCost = price * amount;
    const currentCash = this.getCash();
    const leverage = this.getLeverage();
    const requiredMargin = totalCost / leverage;

    if (currentCash < requiredMargin) {
      return {
        success: false,
        message: `Insufficient simulated margin. Required Margin: ₹${requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })} (with ${leverage}x leverage), Available Cash: ₹${currentCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      };
    }

    const portfolio = this.getPortfolio();
    const existingIndex = portfolio.findIndex(item => item.symbol.toUpperCase() === cleanSymbol);

    let updatedPortfolio: PortfolioItem[];
    if (existingIndex !== -1) {
      const existing = portfolio[existingIndex];
      const newShares = existing.shares + amount;
      const totalCostBasis = (existing.shares * existing.avgBuyPrice) + totalCost;
      const newAvgPrice = totalCostBasis / newShares;

      updatedPortfolio = [...portfolio];
      updatedPortfolio[existingIndex] = {
        ...existing,
        shares: newShares,
        avgBuyPrice: parseFloat(newAvgPrice.toFixed(stock.type === "forex" ? 4 : 2)),
        currentPrice: price
      };
    } else {
      updatedPortfolio = [
        ...portfolio,
        {
          symbol: cleanSymbol,
          name: stock.name,
          shares: amount,
          avgBuyPrice: price,
          currentPrice: price,
          type: stock.type
        }
      ];
    }

    this.setPortfolio(updatedPortfolio);
    this.setCash(parseFloat((currentCash - totalCost).toFixed(2)));

    return {
      success: true,
      message: `Successfully purchased ${amount} ${stock.type === "forex" ? "contracts" : "shares"} of ${cleanSymbol} at ₹${price.toLocaleString()} for a total of ₹${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`
    };
  },

  async sellStock(symbol: string, amount: number): Promise<{ success: boolean; message: string }> {
    const ownerEpoch = getAccountEpoch();
    const cleanSymbol = symbol.toUpperCase();
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please enter a valid amount of shares/contracts." };
    }

    const portfolio = this.getPortfolio();
    const existingIndex = portfolio.findIndex(item => item.symbol.toUpperCase() === cleanSymbol);

    if (existingIndex === -1) {
      return { success: false, message: `You do not own any shares/contracts of ${cleanSymbol}.` };
    }

    const existing = portfolio[existingIndex];
    if (existing.shares < amount) {
      return {
        success: false,
        message: `Insufficient holdings. You own ${existing.shares} shares/contracts but tried to sell ${amount}.`
      };
    }

    // Get current stock price for live sell rate
    const stock = await marketApi.getStockBySymbol(cleanSymbol);
    if (ownerEpoch !== getAccountEpoch()) return { success: false, message: 'Account changed. Please try again.' };
    const price = stock ? stock.price : existing.currentPrice;
    const totalProceeds = price * amount;
    const currentCash = this.getCash();

    let updatedPortfolio: PortfolioItem[] = [...portfolio];
    const remainingShares = existing.shares - amount;

    if (remainingShares === 0) {
      updatedPortfolio.splice(existingIndex, 1);
    } else {
      updatedPortfolio[existingIndex] = {
        ...existing,
        shares: remainingShares,
        currentPrice: price
      };
    }

    this.setPortfolio(updatedPortfolio);
    this.setCash(parseFloat((currentCash + totalProceeds).toFixed(2)));

    return {
      success: true,
      message: `Successfully sold ${amount} ${existing.type === "forex" ? "contracts" : "shares"} of ${cleanSymbol} at ₹${price.toLocaleString()} for total proceeds of ₹${totalProceeds.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`
    };
  }
};
