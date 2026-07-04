import { Stock, StockHistoryItem } from "../types";
import { INDIAN_STOCK_UNIVERSE, generateDynamicUniverseStock } from "./indianStocksDb";
import { robustFetchJson } from "../utils/apiUtils";

// Helper to generate elegant historical candlestick data
export function generateHistory(basePrice: number, points: number = 50, volatility: number = 0.015): StockHistoryItem[] {
  const history: StockHistoryItem[] = [];
  let currentPrice = basePrice * 0.9;
  const now = new Date();

  for (let i = points; i > 0; i--) {
    const timeDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = timeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const changePercent = (Math.random() - 0.48) * volatility; 
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor((Math.random() * 0.5 + 0.5) * 1000000);

    history.push({
      time: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  calculateTechnicalIndicators(history);
  return history;
}

// Compute Technical Indicators dynamically
export function calculateTechnicalIndicators(history: StockHistoryItem[]) {
  const length = history.length;
  if (length === 0) return;

  // 1. Simple Moving Average (SMA - period 14)
  const periodMA = 14;
  for (let i = 0; i < length; i++) {
    if (i < periodMA - 1) {
      history[i].ma = history[i].close;
    } else {
      let sum = 0;
      for (let j = 0; j < periodMA; j++) {
        sum += history[i - j].close;
      }
      history[i].ma = parseFloat((sum / periodMA).toFixed(2));
    }
  }

  // 2. Bollinger Bands
  for (let i = 0; i < length; i++) {
    if (i < periodMA - 1) {
      history[i].bbands = { upper: history[i].close, middle: history[i].close, lower: history[i].close };
    } else {
      const middle = history[i].ma || history[i].close;
      let sumSqDiff = 0;
      for (let j = 0; j < periodMA; j++) {
        sumSqDiff += Math.pow(history[i - j].close - middle, 2);
      }
      const stdDev = Math.sqrt(sumSqDiff / periodMA);
      history[i].bbands = {
        upper: parseFloat((middle + 2 * stdDev).toFixed(2)),
        middle: parseFloat(middle.toFixed(2)),
        lower: parseFloat((middle - 2 * stdDev).toFixed(2))
      };
    }
  }

  // 3. RSI
  const periodRSI = 14;
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < length; i++) {
    const diff = history[i].close - history[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    if (i <= periodRSI) {
      avgGain += gain;
      avgLoss += loss;
      if (i === periodRSI) {
        avgGain /= periodRSI;
        avgLoss /= periodRSI;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        history[i].rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(2));
      } else {
        history[i].rsi = 50;
      }
    } else {
      avgGain = (avgGain * 13 + gain) / 14;
      avgLoss = (avgLoss * 13 + loss) / 14;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      history[i].rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(2));
    }
  }
  for (let i = 0; i < periodRSI; i++) {
    if (history[i] && !history[i].rsi) history[i].rsi = 50;
  }

  // 4. MACD
  for (let i = 0; i < length; i++) {
    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;

    let fastEMA = history[i].close;
    let slowEMA = history[i].close;

    if (i >= slowPeriod) {
      let sumFast = 0;
      for (let j = 0; j < fastPeriod; j++) sumFast += history[i - j].close;
      fastEMA = sumFast / fastPeriod;

      let sumSlow = 0;
      for (let j = 0; j < slowPeriod; j++) sumSlow += history[i - j].close;
      slowEMA = sumSlow / slowPeriod;
    }

    const macdVal = fastEMA - slowEMA;
    let signalVal = 0;
    if (i >= slowPeriod + signalPeriod) {
      let sumMacd = 0;
      for (let j = 0; j < signalPeriod; j++) {
        const idx = i - j;
        const prevFast = history[idx].close;
        sumMacd += prevFast * 0.05;
      }
      signalVal = sumMacd / signalPeriod;
    } else {
      signalVal = macdVal * 0.8;
    }

    history[i].macd = {
      macd: parseFloat(macdVal.toFixed(2)),
      signal: parseFloat(signalVal.toFixed(2)),
      hist: parseFloat((macdVal - signalVal).toFixed(2))
    };
  }
}

// In-Memory state for live price updates
let activeStocks: Stock[] = [];

// Dynamic stock database lookup and generator
export function getOrCreateDynamicStock(symbol: string, metadata?: { name: string; sector: string; exchange: "NSE" | "BSE" }): Stock {
  const cleanSymbol = symbol.toUpperCase().trim();
  const existing = activeStocks.find(s => s.symbol === cleanSymbol);
  if (existing) return existing;

  const item = generateDynamicUniverseStock(cleanSymbol);
  
  // Use metadata if provided (e.g., from server registry)
  const name = metadata?.name || item.name;
  const sector = metadata?.sector || item.sector;
  const exchange = metadata?.exchange || item.exchange;

  const history = generateHistory(item.price, 60, 0.015);
  
  const change = parseFloat(((Math.random() - 0.48) * (item.price * 0.02)).toFixed(2));
  const percentChange = parseFloat(((change / (item.price - change)) * 100).toFixed(2));

  const stockItem: Stock = {
    symbol: cleanSymbol,
    name,
    type: "india",
    price: item.price,
    change,
    percentChange,
    volume: cleanSymbol === "MRF" ? "15K" : `${(1 + Math.random() * 15).toFixed(1)}M`,
    marketCap: item.marketCap,
    dayHigh: parseFloat((item.price * 1.01).toFixed(2)),
    dayLow: parseFloat((item.price * 0.99).toFixed(2)),
    high52: parseFloat((item.price * 1.25).toFixed(2)),
    low52: parseFloat((item.price * 0.75).toFixed(2)),
    trend: percentChange > 0.05 ? "up" : percentChange < -0.05 ? "down" : "flat",
    history,
    sector,
    exchange,
    dataStatus: "DEMO"
  };

  activeStocks.push(stockItem);
  return stockItem;
}

// Initialize memory state
export function initMarketData() {
  if (activeStocks.length > 0) return;

  activeStocks = INDIAN_STOCK_UNIVERSE.map(item => {
    const history = generateHistory(item.price, 60, 0.015);
    const change = parseFloat(((Math.random() - 0.48) * (item.price * 0.02)).toFixed(2));
    const percentChange = parseFloat(((change / (item.price - change)) * 100).toFixed(2));

    return {
      symbol: item.symbol,
      name: item.name,
      type: "india",
      price: item.price,
      change,
      percentChange,
      volume: item.symbol === "MRF" ? "15K" : `${(1 + Math.random() * 15).toFixed(1)}M`,
      marketCap: item.marketCap,
      dayHigh: parseFloat((item.price * 1.01).toFixed(2)),
      dayLow: parseFloat((item.price * 0.99).toFixed(2)),
      high52: parseFloat((item.price * 1.25).toFixed(2)),
      low52: parseFloat((item.price * 0.75).toFixed(2)),
      trend: percentChange > 0.05 ? "up" : percentChange < -0.05 ? "down" : "flat",
      history,
      sector: item.sector,
      exchange: item.exchange,
      dataStatus: "DEMO"
    } as Stock;
  });

  // Load benchmarks explicitly
  const benchmarks = [
    { symbol: "NIFTY50", name: "Nifty 50 Index", price: 24155.80, sector: "Benchmark", exchange: "NSE" as const, volume: "250M" },
    { symbol: "BANKNIFTY", name: "Nifty Bank Index", price: 52350.30, sector: "Benchmark", exchange: "NSE" as const, volume: "180M" },
    { symbol: "SENSEX", name: "BSE SENSEX Index", price: 79560.20, sector: "Benchmark", exchange: "BSE" as const, volume: "50M" }
  ];

  benchmarks.forEach(b => {
    const history = generateHistory(b.price, 60, 0.008);
    const change = parseFloat(((Math.random() - 0.45) * (b.price * 0.01)).toFixed(2));
    const percentChange = parseFloat(((change / (b.price - change)) * 100).toFixed(2));

    activeStocks.push({
      symbol: b.symbol,
      name: b.name,
      type: "india",
      price: b.price,
      change,
      percentChange,
      volume: b.volume,
      marketCap: "Benchmark Index",
      dayHigh: parseFloat((b.price * 1.005).toFixed(2)),
      dayLow: parseFloat((b.price * 0.995).toFixed(2)),
      high52: parseFloat((b.price * 1.15).toFixed(2)),
      low52: parseFloat((b.price * 0.85).toFixed(2)),
      trend: percentChange > 0.05 ? "up" : percentChange < -0.05 ? "down" : "flat",
      history,
      sector: b.sector,
      exchange: b.exchange,
      dataStatus: "DEMO"
    });
  });
}

export function isMarketClosed(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

// Tick prices slightly
export function tickMarketPrices(): Stock[] {
  initMarketData();

  if (isMarketClosed()) {
    activeStocks = activeStocks.map(stock => ({
      ...stock,
      trend: "flat"
    }));
    return activeStocks;
  }

  activeStocks = activeStocks.map(stock => {
    const volatility = 0.003;
    const tickDirection = Math.random() - (stock.symbol === "TCS" || stock.symbol === "ADANIENT" ? 0.51 : 0.48);
    const tickValue = stock.price * changePercentFactor(stock.symbol) * tickDirection * volatility;
    const newPrice = Math.max(1.0, stock.price + tickValue);
    
    const delta = newPrice - (stock.history[stock.history.length - 2]?.close || stock.price * 0.99);
    const pct = (delta / (stock.history[stock.history.length - 2]?.close || stock.price * 0.99)) * 100;

    const updatedHistory = [...stock.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const last = updatedHistory[lastIndex];
      last.close = parseFloat(newPrice.toFixed(2));
      last.high = parseFloat(Math.max(last.high, newPrice).toFixed(2));
      last.low = parseFloat(Math.min(last.low, newPrice).toFixed(2));
    }

    return {
      ...stock,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(delta.toFixed(2)),
      percentChange: parseFloat(pct.toFixed(2)),
      trend: pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat",
      dayHigh: parseFloat(Math.max(stock.dayHigh, newPrice).toFixed(2)),
      dayLow: parseFloat(Math.min(stock.dayLow, newPrice).toFixed(2)),
      history: updatedHistory
    };
  });

  return activeStocks;
}

function changePercentFactor(symbol: string): number {
  switch (symbol) {
    case "TATAMOTORS": return 2.2;
    case "ADANIENT": return 2.5;
    case "NIFTY50":
    case "SENSEX": return 0.8;
    default: return 1.0;
  }
}

// API Service Functions
export const marketApi = {
  isLiveApi(): boolean {
    return true;
  },

  tickMarketPrices(): Stock[] {
    return tickMarketPrices();
  },

  async getAllStocks(): Promise<Stock[]> {
    initMarketData();
    try {
      const liveQuotes = await robustFetchJson<Record<string, any>>("/api/market/all_quotes", {
        timeoutMs: 5000,
        retries: 1
      });
      if (liveQuotes) {
        activeStocks = activeStocks.map(stock => {
          const live = liveQuotes[stock.symbol.toUpperCase()];
          if (live) {
            const updatedHistory = [...stock.history];
            if (updatedHistory.length > 0) {
              updatedHistory[updatedHistory.length - 1].close = live.price;
            }
            return {
              ...stock,
              price: live.price,
              change: live.change,
              percentChange: live.percentChange,
              volume: live.volume || stock.volume,
              dayHigh: live.dayHigh || stock.dayHigh,
              dayLow: live.dayLow || stock.dayLow,
              history: updatedHistory,
              isLive: true,
              dataStatus: live.isLive ? "DELAYED" : "DEMO",
              source: live.isLive ? "Twelve Data API Live Feed" : "Simulated Live Feed"
            };
          }
          return stock;
        });
      }
    } catch (err) {
      console.log("Could not load real-time batch quotes, using simulation fallback:", err);
    }
    return activeStocks;
  },

  async getStocksByType(type: "india" | "forex"): Promise<Stock[]> {
    await this.getAllStocks();
    // Since Forex is removed, always treat as Indian markets
    return activeStocks;
  },

  async getStockBySymbol(symbol: string): Promise<Stock | null> {
    initMarketData();
    const cleanSym = symbol.toUpperCase().trim();
    
    // Auto-generate if not in preloaded list
    let idx = activeStocks.findIndex(s => s.symbol === cleanSym);
    if (idx === -1) {
      getOrCreateDynamicStock(cleanSym);
      idx = activeStocks.findIndex(s => s.symbol === cleanSym);
    }

    try {
      const liveQuote = await robustFetchJson<any>(`/api/market/quote?symbol=${cleanSym}`, {
        timeoutMs: 5000,
        retries: 1
      });
      if (liveQuote) {
        activeStocks[idx] = {
          ...activeStocks[idx],
          price: liveQuote.price,
          change: liveQuote.change,
          percentChange: liveQuote.percentChange,
          volume: liveQuote.volume || activeStocks[idx].volume,
          dayHigh: liveQuote.dayHigh || activeStocks[idx].dayHigh,
          dayLow: liveQuote.dayLow || activeStocks[idx].dayLow,
          isLive: liveQuote.isLive,
          dataStatus: liveQuote.dataStatus || "DEMO",
          source: liveQuote.provider || liveQuote.source || "Simulation Fallback",
          timestamp: liveQuote.timestamp || liveQuote.debug?.timestamp,
          debug: liveQuote.debug
        };
      }
    } catch (err) {
      console.log("Using simulation fallback for live quote:", err);
    }

    return activeStocks[idx];
  },

  async getStockHistoryForTimeframe(symbol: string, timeframe: "1m" | "5m" | "15m" | "1h" | "1D"): Promise<StockHistoryItem[]> {
    initMarketData();
    const cleanSym = symbol.toUpperCase().trim();
    let stock = activeStocks.find(s => s.symbol === cleanSym);
    if (!stock) {
      stock = getOrCreateDynamicStock(cleanSym);
    }

    try {
      const liveHistory = await robustFetchJson<any[]>(`/api/market/history?symbol=${cleanSym}&timeframe=${timeframe}`, {
        timeoutMs: 5000,
        retries: 1
      });
      if (Array.isArray(liveHistory) && liveHistory.length > 0) {
        calculateTechnicalIndicators(liveHistory);
        return liveHistory;
      }
    } catch (err) {
      console.log("Using high-fidelity simulation history:", err);
    }

    let points = 60;
    let volFactor = 0.015;

    switch (timeframe) {
      case "1m":
        points = 60;
        volFactor *= 0.05;
        break;
      case "5m":
        points = 60;
        volFactor *= 0.08;
        break;
      case "15m":
        points = 60;
        volFactor *= 0.12;
        break;
      case "1h":
        points = 60;
        volFactor *= 0.25;
        break;
      case "1D":
        points = 60;
        volFactor *= 1.0;
        break;
    }

    return generateHistory(stock.price, points, volFactor);
  },

  // --------------------------------------------------------
  // NEW REQUIRED FUNCTIONS FOR INDIAN STOCK MARKET INITIATIVE
  // --------------------------------------------------------

  async getIndianStocks(): Promise<Stock[]> {
    return this.getAllStocks();
  },

  async getStockQuote(symbol: string): Promise<Stock | null> {
    return this.getStockBySymbol(symbol);
  },

  async getHistoricalCandles(symbol: string): Promise<StockHistoryItem[]> {
    return this.getStockHistoryForTimeframe(symbol, "1D");
  },

  async getMarketOverview(): Promise<{ gainers: Stock[]; losers: Stock[]; active: Stock[] }> {
    const all = await this.getIndianStocks();
    // Skip index benchmarks in gainers/losers to keep it focus on actual stocks
    const stocksOnly = all.filter(s => s.sector !== "Benchmark");
    
    const sortedByPercent = [...stocksOnly].sort((a, b) => b.percentChange - a.percentChange);
    const gainers = sortedByPercent.slice(0, 5);
    const losers = [...sortedByPercent].reverse().slice(0, 5);
    const active = [...stocksOnly].sort((a, b) => {
      const aVol = parseFloat(a.volume.replace(/[M|K|B]/g, ""));
      const bVol = parseFloat(b.volume.replace(/[M|K|B]/g, ""));
      return bVol - aVol;
    }).slice(0, 5);

    return { gainers, losers, active };
  }
};
