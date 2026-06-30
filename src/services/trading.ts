import { PortfolioItem, Stock } from "../types";
import { marketApi } from "./marketApi";

const PORTFOLIO_KEY = "aura_trading_portfolio";
const CASH_KEY = "aura_trading_cash";

const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", shares: 15, avgBuyPrice: 2820.00, currentPrice: 2885.50, type: "india" },
  { symbol: "TATAMOTORS", name: "Tata Motors Limited", shares: 40, avgBuyPrice: 890.00, currentPrice: 924.50, type: "india" },
  { symbol: "EURUSD", name: "EUR / USD", shares: 5000, avgBuyPrice: 1.0790, currentPrice: 1.0845, type: "forex" }
];

const INITIAL_CASH = 500000; // Starting with ₹5,00,000 cash balance

export const TradingService = {
  getPortfolio(): PortfolioItem[] {
    const stored = localStorage.getItem(PORTFOLIO_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return INITIAL_PORTFOLIO;
      }
    }
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(INITIAL_PORTFOLIO));
    return INITIAL_PORTFOLIO;
  },

  getCash(): number {
    const stored = localStorage.getItem(CASH_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      return isNaN(parsed) ? INITIAL_CASH : parsed;
    }
    localStorage.setItem(CASH_KEY, INITIAL_CASH.toString());
    return INITIAL_CASH;
  },

  setPortfolio(portfolio: PortfolioItem[]) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
    this.notifyChange();
  },

  setCash(cash: number) {
    localStorage.setItem(CASH_KEY, cash.toString());
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
