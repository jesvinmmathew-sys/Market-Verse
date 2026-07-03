import { REAL_NSE_STOCKS } from "../src/services/nseFallbackList.js";

export interface StockQuoteRaw {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  volume: string;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
  exchange: "NSE" | "BSE";
  dataStatus: "LIVE" | "DELAYED" | "DEMO";
  provider: string;
  rawResponse: any;
}

export function getYahooSymbol(symbol: string, exchange: string = "NSE"): string {
  let clean = symbol.toUpperCase().trim();
  if (clean === "NIFTY50") return "^NSEI";
  if (clean === "BANKNIFTY") return "^NSEBANK";
  if (clean === "SENSEX") return "^BSESN";
  if (clean === "L&T") {
    clean = "LT";
  }

  if (exchange === "BSE") {
    return `${clean}.BO`;
  }
  return `${clean}.NS`;
}

export function reverseYahooSymbol(yahooSymbol: string): string {
  const clean = yahooSymbol.toUpperCase().trim();
  if (clean === "^NSEI") return "NIFTY50";
  if (clean === "^NSEBANK") return "BANKNIFTY";
  if (clean === "^BSESN") return "SENSEX";
  if (clean === "LT.NS") return "LT";
  if (clean === "LT.BO") return "LT";

  return clean.replace(".NS", "").replace(".BO", "");
}

// Robust Yahoo Finance fetch helper with user-agent spoofing and fallback endpoint
async function fetchYahoo(url: string): Promise<any> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://finance.yahoo.com",
    "Referer": "https://finance.yahoo.com/",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  };

  try {
    const response = await fetch(url, { headers });
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (err: any) {
    if (url.includes("query1.finance.yahoo.com")) {
      const fallbackUrl = url.replace("query1.finance.yahoo.com", "query2.finance.yahoo.com");
      console.log(`[Yahoo Finance] Query1 failed (${err.message}). Trying Query2: ${fallbackUrl}`);
      try {
        const response = await fetch(fallbackUrl, { headers });
        if (response.ok) {
          return await response.json();
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (fallbackErr: any) {
        throw new Error(`Yahoo Query1 & Query2 failed. Query2 Error: ${fallbackErr.message}`);
      }
    }
    throw err;
  }
}

// Fetch quote using simpler v7 endpoint as a fallback for chart-based quote
async function fetchQuoteFromV7(symbol: string, exchange: string = "NSE"): Promise<StockQuoteRaw> {
  const yahooSym = getYahooSymbol(symbol, exchange);
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSym)}`;
  console.log(`[Yahoo Finance Quote v7] Fetching v7 quote fallback for ${symbol} as ${yahooSym}`);
  
  const json = await fetchYahoo(url);
  const result = json?.quoteResponse?.result?.[0];
  
  if (!result) {
    throw new Error(`No quote data returned from Yahoo v7 for ${symbol} (${yahooSym})`);
  }

  const price = parseFloat(result.regularMarketPrice || "0");
  const previousClose = parseFloat(result.regularMarketPreviousClose || String(price));
  const change = parseFloat(result.regularMarketChange || "0") || parseFloat((price - previousClose).toFixed(2));
  const percentChange = parseFloat(result.regularMarketChangePercent || "0") || (previousClose !== 0 ? parseFloat(((change / previousClose) * 100).toFixed(2)) : 0);

  const open = parseFloat(result.regularMarketOpen || String(price - change));
  const high = parseFloat(result.regularMarketDayHigh || String(price));
  const low = parseFloat(result.regularMarketDayLow || String(price));
  const volumeVal = result.regularMarketVolume || 0;
  const volume = volumeVal ? (volumeVal > 1000000 ? `${(volumeVal / 1000000).toFixed(1)}M` : `${(volumeVal / 1000).toFixed(1)}K`) : "N/A";

  const timestamp = result.regularMarketTime ? new Date(result.regularMarketTime * 1000).toISOString() : new Date().toISOString();
  const name = result.longName || result.shortName || REAL_NSE_STOCKS.find(s => s.symbol === symbol)?.name || `${symbol} India Limited`;

  return {
    symbol,
    name,
    price,
    change,
    percentChange,
    volume,
    open,
    high,
    low,
    previousClose,
    timestamp,
    exchange: exchange as "NSE" | "BSE",
    dataStatus: "DELAYED",
    provider: "Yahoo Finance v7 Quote Provider",
    rawResponse: result
  };
}

export const indianMarketProvider = {
  name: "Yahoo Finance Indian Market Provider",

  async fetchQuote(symbol: string, exchange: string = "NSE"): Promise<StockQuoteRaw> {
    const yahooSym = getYahooSymbol(symbol, exchange);
    // Fetch 5 days range to ensure we have previous close and current data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?range=5d&interval=1d`;
    
    console.log(`[Yahoo Finance Chart Quote] Fetching chart-based quote for ${symbol} as ${yahooSym}`);
    
    try {
      const json = await fetchYahoo(url);
      const result = json?.chart?.result?.[0];
      
      if (!result) {
        throw new Error(`No chart data returned for ${symbol} (${yahooSym})`);
      }

      const meta = result.meta || {};
      const price = parseFloat(meta.regularMarketPrice || meta.chartPreviousClose || "0");
      const previousClose = parseFloat(meta.previousClose || meta.chartPreviousClose || String(price));
      const change = parseFloat((price - previousClose).toFixed(2));
      const percentChange = previousClose !== 0 ? parseFloat(((change / previousClose) * 100).toFixed(2)) : 0;

      const indicators = result.indicators?.quote?.[0] || {};
      const opens = indicators.open || [];
      const highs = indicators.high || [];
      const lows = indicators.low || [];
      const volumes = indicators.volume || [];

      // Get the latest valid data point index
      let lastIdx = opens.length - 1;
      while (lastIdx >= 0 && (opens[lastIdx] === null || opens[lastIdx] === undefined)) {
        lastIdx--;
      }

      const open = lastIdx >= 0 ? parseFloat(opens[lastIdx]?.toFixed(2)) : price;
      const high = lastIdx >= 0 ? parseFloat(highs[lastIdx]?.toFixed(2)) : price;
      const low = lastIdx >= 0 ? parseFloat(lows[lastIdx]?.toFixed(2)) : price;
      const volumeVal = lastIdx >= 0 ? volumes[lastIdx] : 0;
      const volume = volumeVal ? (volumeVal > 1000000 ? `${(volumeVal / 1000000).toFixed(1)}M` : `${(volumeVal / 1000).toFixed(1)}K`) : "N/A";

      const timestamp = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString();
      const name = REAL_NSE_STOCKS.find(s => s.symbol === symbol)?.name || `${symbol} India Limited`;

      return {
        symbol,
        name,
        price,
        change,
        percentChange,
        volume,
        open,
        high,
        low,
        previousClose,
        timestamp,
        exchange: exchange as "NSE" | "BSE",
        dataStatus: "DELAYED",
        provider: "Yahoo Finance Chart Quote Provider",
        rawResponse: result
      };
    } catch (err: any) {
      console.warn(`[Yahoo Finance Chart Quote] Failed to fetch v8 chart for ${symbol}: ${err.message}. Trying v7 quote fallback...`);
      try {
        return await fetchQuoteFromV7(symbol, exchange);
      } catch (v7Err: any) {
        throw new Error(`Yahoo v8 and v7 quote methods failed. v8: ${err.message}, v7: ${v7Err.message}`);
      }
    }
  },

  async fetchBatchQuotes(symbols: string[]): Promise<Record<string, StockQuoteRaw>> {
    console.log(`[Yahoo Finance Batch] Fetching batch quotes for ${symbols.length} symbols via parallelized charts`);
    const mappedResults: Record<string, StockQuoteRaw> = {};

    const promises = symbols.map(async (symbol) => {
      const fallback = REAL_NSE_STOCKS.find(item => item.symbol === symbol);
      const ex = fallback?.exchange || "NSE";
      try {
        const quote = await this.fetchQuote(symbol, ex);
        mappedResults[symbol] = quote;
      } catch (err: any) {
        console.warn(`[Yahoo Finance Batch Item Failed] ${symbol}:`, err.message);
      }
    });

    await Promise.allSettled(promises);
    return mappedResults;
  },

  async fetchHistory(symbol: string, timeframe: string, exchange: string = "NSE"): Promise<any[]> {
    const yahooSym = getYahooSymbol(symbol, exchange);
    
    let interval = "1d";
    let range = "1mo";
    if (timeframe === "1D" || timeframe === "1m") { interval = "15m"; range = "1d"; }
    else if (timeframe === "5D" || timeframe === "5m") { interval = "1h"; range = "5d"; }
    else if (timeframe === "15m") { interval = "15m"; range = "5d"; }
    else if (timeframe === "1H" || timeframe === "1h") { interval = "1h"; range = "1mo"; }
    else if (timeframe === "1M" || timeframe === "1D") { interval = "1d"; range = "1mo"; }
    else if (timeframe === "6M") { interval = "1d"; range = "6mo"; }
    else if (timeframe === "1Y") { interval = "1wk"; range = "1y"; }
    else if (timeframe === "5Y") { interval = "1mo"; range = "5y"; }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?range=${range}&interval=${interval}`;
    console.log(`[Yahoo Finance] Fetching history for ${symbol} (${yahooSym}) with range=${range}, interval=${interval}`);

    const json = await fetchYahoo(url);
    const result = json?.chart?.result?.[0];
    if (!result) {
      throw new Error(`No chart history returned for ${symbol} (${yahooSym})`);
    }

    const timestamps = result.timestamp || [];
    const indicators = result.indicators?.quote?.[0] || {};
    const opens = indicators.open || [];
    const highs = indicators.high || [];
    const lows = indicators.low || [];
    const closes = indicators.close || [];
    const volumes = indicators.volume || [];

    const historyList: any[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] === null || closes[i] === undefined) continue;
      
      const timeDate = new Date(timestamps[i] * 1000);
      const timeStr = timeframe === "1D" || timeframe === "5D" || timeframe === "1m" || timeframe === "5m" || timeframe === "15m" || timeframe === "1h"
        ? timeDate.toISOString()
        : timeDate.toISOString().split("T")[0];

      historyList.push({
        time: timeStr,
        open: parseFloat(opens[i]?.toFixed(2) || closes[i]?.toFixed(2)),
        high: parseFloat(highs[i]?.toFixed(2) || closes[i]?.toFixed(2)),
        low: parseFloat(lows[i]?.toFixed(2) || closes[i]?.toFixed(2)),
        close: parseFloat(closes[i]?.toFixed(2)),
        volume: parseInt(volumes[i] || "0")
      });
    }

    return historyList;
  }
};
