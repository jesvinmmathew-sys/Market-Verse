import { REAL_NSE_STOCKS } from "../src/services/nseFallbackList.js";
import { StockQuoteRaw, indianMarketProvider } from "./indianMarketProvider.js";
import { generateDynamicUniverseStock } from "../src/services/indianStocksDb.js";

const BASE_URL = "https://indian-stock-market-api2.onrender.com";

// Helper to clean up stock symbols (removes .NS, .BO for the API)
export function cleanSymbolForApi(symbol: string): string {
  const clean = symbol.toUpperCase().trim();
  return clean.replace(".NS", "").replace(".BO", "");
}

/**
 * Search for Indian stocks using the API.
 * GET /search?q={query}
 */
export async function searchIndianStock(query: string): Promise<any[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  console.log(`[Indian Stock API] Searching for: ${query}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Search API responded with status ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data?.results || []);
  } catch (err: any) {
    console.warn("[Indian Stock API] Search error:", err.message);
    // Return simple local match fallback
    return REAL_NSE_STOCKS.filter(s => 
      s.symbol.toUpperCase().includes(query.toUpperCase()) || 
      s.name.toUpperCase().includes(query.toUpperCase())
    );
  }
}

/**
 * Fetch quote for a single stock.
 * GET /stock?symbol={SYMBOL}&res=num
 */
export async function getIndianStockQuote(symbol: string): Promise<StockQuoteRaw> {
  const cleanSym = cleanSymbolForApi(symbol);
  // Find exchange in fallback list
  const fallback = REAL_NSE_STOCKS.find(s => s.symbol === cleanSym);
  const exchange = fallback?.exchange || "NSE";
  
  // Try Yahoo Finance first as it is extremely reliable and doesn't suffer from Render API's 404/sleep limitations
  try {
    return await indianMarketProvider.fetchQuote(cleanSym, exchange);
  } catch (err: any) {
    console.warn(`[Indian Stock API] Yahoo Finance failed for ${cleanSym} (${err.message}). Trying Render API...`);
    try {
      // Suffix appropriate exchange if needed (some API instances expect RELIANCE.NS, others RELIANCE)
      // Let's try to query with the clean symbol first, and fall back to the suffixed one if it fails or returns empty.
      const url = `${BASE_URL}/stock?symbol=${encodeURIComponent(cleanSym)}&res=num`;
      console.log(`[Indian Stock API] Fetching quote for: ${cleanSym}`);
      
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      };

      let response = await fetch(url, { headers });
      let data: any;

      if (response.ok) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          // Keep data undefined to trigger fallback
        }
      }

      if (!response.ok || !data || Object.keys(data).length === 0 || data.error) {
        const suffixedSym = exchange === "BSE" ? `${cleanSym}.BO` : `${cleanSym}.NS`;
        const fallbackUrl = `${BASE_URL}/stock?symbol=${encodeURIComponent(suffixedSym)}&res=num`;
        console.log(`[Indian Stock API Fallback] Fetching suffixed quote for ${suffixedSym} from ${fallbackUrl}`);
        
        response = await fetch(fallbackUrl, { headers });
        if (!response.ok) {
          throw new Error(`Stock API responded with status ${response.status} for both clean and suffixed symbols`);
        }
        data = await response.json();
        if (!data || Object.keys(data).length === 0 || data.error) {
          throw new Error(`Invalid stock data returned for both ${cleanSym} and ${suffixedSym}: ${data?.error || "Empty response"}`);
        }
      }
      
      // Handle various property mappings returned by different versions of the API
      const price = parseFloat(data.price || data.currentPrice || data.regularMarketPrice || data.lastPrice || "0");
      const change = parseFloat(data.change || data.priceChange || data.regularMarketChange || "0");
      const percentChange = parseFloat(data.percentChange || data.changePercent || data.regularMarketChangePercent || data.priceChangePercent || "0");
      const open = parseFloat(data.open || data.regularMarketOpen || String(price - change));
      const high = parseFloat(data.high || data.dayHigh || data.regularMarketDayHigh || String(price));
      const low = parseFloat(data.low || data.dayLow || data.regularMarketDayLow || String(price));
      const previousClose = parseFloat(data.previousClose || data.regularMarketPreviousClose || String(price - change));
      const volumeVal = data.volume || data.regularMarketVolume || 0;
      
      let volume = "N/A";
      if (volumeVal) {
        const volNum = parseFloat(String(volumeVal).replace(/[^0-9.]/g, ""));
        if (!isNaN(volNum)) {
          volume = volNum > 1000000 ? `${(volNum / 1000000).toFixed(1)}M` : volNum > 1000 ? `${(volNum / 1000).toFixed(1)}K` : String(volNum);
        } else {
          volume = String(volumeVal);
        }
      }

      const name = data.name || data.longName || data.shortName || fallback?.name || `${cleanSym} India Limited`;
      const timestamp = data.timestamp || new Date().toISOString();

      return {
        symbol: cleanSym,
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
        provider: "Indian Stock Market API",
        rawResponse: data
      };
    } catch (renderErr: any) {
      console.warn(`[Indian Stock API Error] All primary quote methods failed for ${cleanSym}:`, renderErr.message);
      // Return a basic placeholder using fallback list instead of crashing
      const fallbackMeta = generateDynamicUniverseStock(cleanSym);
      const fallbackPrice = fallbackMeta?.price || 150.0;
      return {
        symbol: cleanSym,
        name: fallback?.name || `${cleanSym} India Limited`,
        price: fallbackPrice,
        change: 0,
        percentChange: 0,
        volume: "1.0M",
        open: fallbackPrice,
        high: fallbackPrice,
        low: fallbackPrice,
        previousClose: fallbackPrice,
        timestamp: new Date().toISOString(),
        exchange: exchange as "NSE" | "BSE",
        dataStatus: "DEMO",
        provider: "Local NSE Fallback",
        rawResponse: { demo: true }
      };
    }
  }
}

/**
 * Fetch quotes for multiple stocks in a single request.
 * GET /stock/list?symbols={symbols}&res=num
 */
export async function getMultipleStocks(symbols: string[]): Promise<Record<string, StockQuoteRaw>> {
  const cleanSymbols = symbols.map(s => cleanSymbolForApi(s));
  const results: Record<string, StockQuoteRaw> = {};

  // Try Yahoo Finance batch fetching first for absolute speed and reliability
  try {
    const yahooResults = await indianMarketProvider.fetchBatchQuotes(cleanSymbols);
    Object.assign(results, yahooResults);
  } catch (err: any) {
    console.warn(`[Indian Stock API] Yahoo Finance batch failed: ${err.message}. Trying Render API...`);
    
    // Fall back to Render API batch fetch if Yahoo batch fails completely
    const url = `${BASE_URL}/stock/list?symbols=${encodeURIComponent(cleanSymbols.join(","))}&res=num`;
    console.log(`[Indian Stock API] Fetching batch quotes for: ${cleanSymbols.join(", ")}`);

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache"
    };

    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (!item) return;
            const sym = cleanSymbolForApi(item.symbol || "");
            if (!sym) return;
            results[sym] = mapSingleItemToQuote(item, sym);
          });
        } else if (data && typeof data === "object") {
          Object.entries(data).forEach(([key, item]: [string, any]) => {
            const sym = cleanSymbolForApi(key);
            results[sym] = mapSingleItemToQuote(item, sym);
          });
        }
      } else {
        console.warn(`[Indian Stock API] Batch list endpoint returned status ${response.status}`);
      }
    } catch (renderErr: any) {
      console.warn(`[Indian Stock API] Batch list endpoint failed: ${renderErr.message}`);
    }
  }

  // Find symbols that are missing from our results
  const missingSymbols = cleanSymbols.filter(sym => !results[sym]);
  
  if (missingSymbols.length > 0) {
    console.log(`[Indian Stock API] Fetching ${missingSymbols.length} missing symbols individually in parallel`);
    // Query missing symbols in parallel using Promise.allSettled for robust speed
    const promises = missingSymbols.map(async (sym) => {
      try {
        const quote = await getIndianStockQuote(sym);
        results[sym] = quote;
      } catch (err: any) {
        console.warn(`[Indian Stock API] Individual fetch failed for ${sym}: ${err.message}`);
      }
    });
    await Promise.allSettled(promises);
  }

  return results;
}

function mapSingleItemToQuote(data: any, symbol: string): StockQuoteRaw {
  const fallback = REAL_NSE_STOCKS.find(s => s.symbol === symbol);
  const exchange = fallback?.exchange || "NSE";

  const price = parseFloat(data.price || data.currentPrice || data.regularMarketPrice || data.lastPrice || "0");
  const change = parseFloat(data.change || data.priceChange || data.regularMarketChange || "0");
  const percentChange = parseFloat(data.percentChange || data.changePercent || data.regularMarketChangePercent || data.priceChangePercent || "0");
  const open = parseFloat(data.open || data.regularMarketOpen || String(price - change));
  const high = parseFloat(data.high || data.dayHigh || data.regularMarketDayHigh || String(price));
  const low = parseFloat(data.low || data.dayLow || data.regularMarketDayLow || String(price));
  const previousClose = parseFloat(data.previousClose || data.regularMarketPreviousClose || String(price - change));
  const volumeVal = data.volume || data.regularMarketVolume || 0;

  let volume = "N/A";
  if (volumeVal) {
    const volNum = parseFloat(String(volumeVal).replace(/[^0-9.]/g, ""));
    if (!isNaN(volNum)) {
      volume = volNum > 1000000 ? `${(volNum / 1000000).toFixed(1)}M` : volNum > 1000 ? `${(volNum / 1000).toFixed(1)}K` : String(volNum);
    } else {
      volume = String(volumeVal);
    }
  }

  const name = data.name || data.longName || data.shortName || fallback?.name || `${symbol} India Limited`;
  const timestamp = data.timestamp || new Date().toISOString();

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
    provider: "Indian Stock Market API",
    rawResponse: data
  };
}

/**
 * Fetch chart history for a symbol.
 * Note: Since the Indian Stock Market API relies on yfinance internally, it doesn't always expose historical candles.
 * We'll design a robust history function that gets chart data using yfinance chart query or fallback.
 */
export async function getStockHistory(symbol: string, timeframe: string = "1D"): Promise<any[]> {
  const cleanSym = cleanSymbolForApi(symbol);
  // Find exchange in fallback list
  const fallback = REAL_NSE_STOCKS.find(s => s.symbol === cleanSym);
  const exchange = fallback?.exchange || "NSE";
  
  // Formulate yfinance symbol expected by query1.finance.yahoo.com/v8/finance/chart
  const yahooSym = cleanSym === "NIFTY50" ? "^NSEI" : cleanSym === "BANKNIFTY" ? "^NSEBANK" : cleanSym === "SENSEX" ? "^BSESN" : exchange === "BSE" ? `${cleanSym}.BO` : `${cleanSym}.NS`;

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
  console.log(`[Indian Stock API] Fetching history for ${cleanSym} via ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`History chart fetch failed with status ${response.status}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No chart history returned for ${cleanSym}`);
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
