import { PortfolioItem, Stock } from "../types";
import { marketApi } from "./marketApi";

const getUserId = (): string => {
  try {
    const userStored = localStorage.getItem("supabase_user");
    if (userStored) {
      const parsed = JSON.parse(userStored);
      return parsed.id || "guest";
    }
  } catch (_) {}
  return "guest";
};

const getPortfolioKey = () => `marketverse_portfolio_${getUserId()}`;
const getCashKey = () => `marketverse_cash_${getUserId()}`;

const INITIAL_PORTFOLIO: PortfolioItem[] = [];
const INITIAL_CASH = 1000000; // Starting with ₹10,00,000 cash balance

export const TradingService = {
  getPortfolio(): PortfolioItem[] {
    const key = getPortfolioKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return INITIAL_PORTFOLIO;
      }
    }
    localStorage.setItem(key, JSON.stringify(INITIAL_PORTFOLIO));
    return INITIAL_PORTFOLIO;
  },

  getCash(): number {
    const key = getCashKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = parseFloat(stored);
      return isNaN(parsed) ? INITIAL_CASH : parsed;
    }
    localStorage.setItem(key, INITIAL_CASH.toString());
    return INITIAL_CASH;
  },

  setPortfolio(portfolio: PortfolioItem[]) {
    localStorage.setItem(getPortfolioKey(), JSON.stringify(portfolio));
    this.notifyChange();
  },

  setCash(cash: number) {
    localStorage.setItem(getCashKey(), cash.toString());
    this.notifyChange();
  },

  resetAccount() {
    localStorage.setItem(getPortfolioKey(), JSON.stringify(INITIAL_PORTFOLIO));
    localStorage.setItem(getCashKey(), INITIAL_CASH.toString());
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
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(newPortfolio));
    }
    return newPortfolio;
  },

  async buyStock(symbol: string, amount: number): Promise<{ success: boolean; message: string }> {
    const cleanSymbol = symbol.toUpperCase();
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please enter a valid amount of shares/contracts." };
    }

    // Get current stock price
    const stock = await marketApi.getStockBySymbol(cleanSymbol);
    if (!stock) {
      return { success: false, message: `Asset with symbol ${cleanSymbol} not found.` };
    }

    const price = stock.price;
    const totalCost = price * amount;
    const currentCash = this.getCash();

    if (currentCash < totalCost) {
      return {
        success: false,
        message: `Insufficient simulated funds. Required: ₹${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}, Available: ₹${currentCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
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
