// Market Tools Layer - Functions for Real-Time Technical and Quote Analysis

export interface TechnicalIndicators {
  rsi: number;
  macd: { macd: number; signal: number; hist: number };
  ma: number;
  trend: "Bullish" | "Bearish" | "Neutral";
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  dataStatus: "LIVE" | "DELAYED" | "DEMO";
}

/**
 * Fetch current quote data for a symbol
 */
export async function fetchCurrentStockData(symbol: string): Promise<StockQuote> {
  const symbolUpper = symbol.toUpperCase().trim();
  const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbolUpper)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch current stock data for ${symbolUpper}`);
  }
  const data = await res.json();
  const price = data.price || 100;
  const change = data.change || 0;
  const percentChange = data.percentChange || 0;
  const close = price;
  const open = parseFloat((close - change).toFixed(2));
  const dayHigh = data.dayHigh || parseFloat((price * 1.01).toFixed(2));
  const dayLow = data.dayLow || parseFloat((price * 0.99).toFixed(2));
  
  return {
    symbol: data.symbol || symbolUpper,
    name: data.name || symbolUpper,
    price,
    change,
    percentChange,
    volume: parseInt(String(data.volume || "0").replace(/[^0-9]/g, "")) || 1500000,
    dayHigh,
    dayLow,
    open,
    previousClose: open,
    dataStatus: data.dataStatus || (data.source?.includes("Live") ? "LIVE" : "DEMO")
  };
}

/**
 * Fetch candles for a symbol
 */
export async function fetchStockCandles(symbol: string): Promise<any[]> {
  const symbolUpper = symbol.toUpperCase().trim();
  const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbolUpper)}&timeframe=1M`);
  if (!res.ok) {
    throw new Error(`Failed to fetch candles for ${symbolUpper}`);
  }
  return res.json();
}

/**
 * Calculate RSI, MACD, Moving Average, and Trend
 */
export async function calculateTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
  const candles = await fetchStockCandles(symbol);
  if (!candles || candles.length === 0) {
    return {
      rsi: 50,
      macd: { macd: 0, signal: 0, hist: 0 },
      ma: 0,
      trend: "Neutral"
    };
  }

  // Moving average (14-day SMA)
  const len = candles.length;
  const slice14 = candles.slice(-14);
  const sum = slice14.reduce((acc, c) => acc + c.close, 0);
  const ma = parseFloat((sum / Math.min(14, len)).toFixed(2));

  // RSI (14-day standard)
  let gains = 0;
  let losses = 0;
  for (let i = Math.max(1, len - 14); i < len; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = losses === 0 ? 999 : gains / losses;
  const rsi = parseFloat((100 - (100 / (1 + rs))).toFixed(2));

  // MACD (12, 26, 9)
  // Simple approximation of EMA 12 and EMA 26
  let ema12 = candles[0].close;
  let ema26 = candles[0].close;
  const k12 = 2 / (12 + 1);
  const k26 = 2 / (26 + 1);
  const macdValues: number[] = [];

  for (let i = 1; i < len; i++) {
    ema12 = candles[i].close * k12 + ema12 * (1 - k12);
    ema26 = candles[i].close * k26 + ema26 * (1 - k26);
    macdValues.push(ema12 - ema26);
  }

  const macdVal = macdValues.length > 0 ? macdValues[macdValues.length - 1] : 0;
  
  // Signal line (EMA 9 of MACD values)
  let signalVal = 0;
  if (macdValues.length > 0) {
    signalVal = macdValues[0];
    const k9 = 2 / (9 + 1);
    for (let i = 1; i < macdValues.length; i++) {
      signalVal = macdValues[i] * k9 + signalVal * (1 - k9);
    }
  }

  const histVal = macdVal - signalVal;
  const lastPrice = candles[len - 1].close;
  const trend = lastPrice > ma ? "Bullish" : lastPrice < ma ? "Bearish" : "Neutral";

  return {
    rsi,
    macd: {
      macd: parseFloat(macdVal.toFixed(2)),
      signal: parseFloat(signalVal.toFixed(2)),
      hist: parseFloat(histVal.toFixed(2))
    },
    ma,
    trend
  };
}
