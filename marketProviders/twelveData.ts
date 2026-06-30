import { REAL_NSE_STOCKS } from "../src/services/nseFallbackList.js";
import { StockQuoteRaw } from "./indianMarketProvider.js";

function getTwelveSymbol(symbol: string): string {
  const clean = symbol.toUpperCase().trim();
  if (clean.includes(":")) return clean;
  if (clean === "NIFTY50") return "NIFTY:NSE";
  if (clean === "BANKNIFTY") return "BANKNIFTY:NSE";
  if (clean === "SENSEX") return "SENSEX:BSE";
  
  if (clean.length === 6 && !clean.includes("/")) {
    return `${clean.substring(0, 3)}/${clean.substring(3)}`;
  }
  return `${clean}:NSE`;
}

export const twelveDataProvider = {
  name: "Twelve Data API Provider",

  async fetchQuote(symbol: string, apiKey: string): Promise<StockQuoteRaw> {
    const twelveSymbol = getTwelveSymbol(symbol);
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(twelveSymbol)}&apikey=${apiKey}`;
    
    console.log(`[Twelve Data] Fetching quote for ${symbol} as ${twelveSymbol}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data HTTP Error: ${response.status}`);
    }
    
    const json = await response.json();
    if (json.status === "error" || !json.price) {
      throw new Error(json.message || "Twelve Data Quote Error");
    }

    const price = parseFloat(json.close || json.price || "0");
    const change = parseFloat(json.change || "0");
    const percentChange = parseFloat(json.percent_change || "0");
    const open = parseFloat(json.open || String(price - change));
    const high = parseFloat(json.high || String(price));
    const low = parseFloat(json.low || String(price));
    const previousClose = parseFloat(json.previous_close || String(price - change));
    const volume = json.volume || "N/A";
    
    const timestamp = json.timestamp ? new Date(json.timestamp * 1000).toISOString() : new Date().toISOString();
    
    const dataStatus = "DELAYED";
    const name = json.name || REAL_NSE_STOCKS.find(s => s.symbol === symbol)?.name || `${symbol} India Limited`;

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
      exchange: (symbol === "SENSEX" ? "BSE" : "NSE") as "NSE" | "BSE",
      dataStatus,
      provider: this.name,
      rawResponse: json
    };
  },

  async fetchBatchQuotes(symbols: string[], apiKey: string): Promise<Record<string, StockQuoteRaw>> {
    const twelveSymbols = symbols.map(s => getTwelveSymbol(s));
    const url = `https://api.twelvedata.com/quote?symbol=${twelveSymbols.join(",")}&apikey=${apiKey}`;
    
    console.log(`[Twelve Data] Fetching batch quotes for ${symbols.length} symbols`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data Batch HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    if (json.status === "error") {
      throw new Error(json.message || "Twelve Data Batch Quote Error");
    }

    const mappedResults: Record<string, StockQuoteRaw> = {};

    symbols.forEach(symbol => {
      const twelveSym = getTwelveSymbol(symbol);
      const symData = json[twelveSym];
      if (!symData) return;

      const price = parseFloat(symData.close || symData.price || "0");
      const change = parseFloat(symData.change || "0");
      const percentChange = parseFloat(symData.percent_change || "0");
      const open = parseFloat(symData.open || String(price - change));
      const high = parseFloat(symData.high || String(price));
      const low = parseFloat(symData.low || String(price));
      const previousClose = parseFloat(symData.previous_close || String(price - change));
      const volume = symData.volume || "N/A";
      
      const timestamp = symData.timestamp ? new Date(symData.timestamp * 1000).toISOString() : new Date().toISOString();
      const dataStatus = "DELAYED";
      const name = symData.name || REAL_NSE_STOCKS.find(s => s.symbol === symbol)?.name || `${symbol} India Limited`;

      mappedResults[symbol] = {
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
        exchange: (symbol === "SENSEX" ? "BSE" : "NSE") as "NSE" | "BSE",
        dataStatus,
        provider: this.name,
        rawResponse: symData
      };
    });

    return mappedResults;
  },

  async fetchHistory(symbol: string, timeframe: string, apiKey: string): Promise<any[]> {
    const twelveSymbol = getTwelveSymbol(symbol);
    
    let interval = "1day";
    let outputsize = "60";
    if (timeframe === "1D" || timeframe === "1m") { interval = "15min"; outputsize = "32"; }
    else if (timeframe === "5D" || timeframe === "5m") { interval = "1h"; outputsize = "40"; }
    else if (timeframe === "15m") { interval = "15min"; outputsize = "60"; }
    else if (timeframe === "1h") { interval = "1h"; outputsize = "60"; }
    else if (timeframe === "1M" || timeframe === "1D") { interval = "1day"; outputsize = "30"; }
    else if (timeframe === "6M") { interval = "1day"; outputsize = "120"; }
    else if (timeframe === "1Y") { interval = "1week"; outputsize = "52"; }
    else if (timeframe === "5Y") { interval = "1month"; outputsize = "60"; }

    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(twelveSymbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
    console.log(`[Twelve Data] Fetching history for ${symbol} (${twelveSymbol}) with interval=${interval}, outputsize=${outputsize}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data History HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    if (json.status === "error" || !json.values) {
      throw new Error(json.message || "Twelve Data History Values Error");
    }

    const values = json.values || [];
    return values.map((v: any) => ({
      time: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume || "0")
    })).reverse();
  }
};
