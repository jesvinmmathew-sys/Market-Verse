import { REAL_NSE_STOCKS, IndianStockMetadata as BaseStockMetadata } from "./nseFallbackList.js";

export interface IndianStockMetadata {
  symbol: string;
  name: string;
  sector: string;
  exchange: "NSE" | "BSE";
  price: number;
  marketCap: string;
}

// Generate deterministic price and market cap for the fallback list
export const INDIAN_STOCK_UNIVERSE: IndianStockMetadata[] = REAL_NSE_STOCKS.map(s => {
  // Deterministic seed hashing based on symbol characters
  let hash = 0;
  for (let i = 0; i < s.symbol.length; i++) {
    hash = s.symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Price between ₹10 and ₹15000 based on hash
  let price = 50 + (Math.abs(hash * 7) % 4500);
  if (s.symbol === "MRF") {
    price = 125000.00; // Keep MRF high price for realism
  } else if (s.symbol === "TCS") {
    price = 3850.00;
  } else if (s.symbol === "RELIANCE") {
    price = 2950.00;
  } else if (s.symbol === "INFY") {
    price = 1530.00;
  } else if (s.symbol === "HDFCBANK") {
    price = 1720.00;
  }
  
  price = parseFloat(price.toFixed(2));
  
  const capVal = (5 + (Math.abs(hash * 19) % 800)) / 10;
  const marketCap = s.symbol === "RELIANCE" ? "19.5T INR" : s.symbol === "TCS" ? "14.1T INR" : `${capVal.toFixed(1)}T INR`;

  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    exchange: s.exchange,
    price,
    marketCap
  };
});

// Helper to look up or search Indian stocks dynamically
export function findStockInUniverse(query: string): IndianStockMetadata[] {
  const cleanQuery = query.toUpperCase().trim();
  if (!cleanQuery) return [];
  
  return INDIAN_STOCK_UNIVERSE.filter(s => 
    s.symbol.includes(cleanQuery) || 
    s.name.toUpperCase().includes(cleanQuery)
  );
}

// Generate dynamic listed stock schemas for custom lookups
export function generateDynamicUniverseStock(symbol: string): IndianStockMetadata {
  const cleanSymbol = symbol.toUpperCase().trim();
  
  // Deterministic seed hashing based on symbol characters
  let hash = 0;
  for (let i = 0; i < cleanSymbol.length; i++) {
    hash = cleanSymbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const sectors = ["Banking", "IT", "Automobile", "Pharma", "Energy", "FMCG", "Infrastructure", "Metals", "Telecom", "Finance"];
  const sector = sectors[Math.abs(hash) % sectors.length];
  const exchange = Math.abs(hash * 3) % 2 === 0 ? "NSE" : "BSE";
  
  const price = Math.abs(hash) % 2 === 0 
    ? parseFloat((50 + (Math.abs(hash * 7) % 4500)).toFixed(2))
    : parseFloat((5 + (Math.abs(hash * 13) % 1500)).toFixed(2));
    
  const marketCap = `${(5 + (Math.abs(hash * 19) % 800)) / 10}T INR`;
  
  // Format standard dynamic company name (only real names are loaded dynamically from server, but client fallback handles this)
  let companyType = "Industries Limited";
  if (sector === "Banking") companyType = "Bank Limited";
  else if (sector === "Pharma") companyType = "Pharmaceuticals Limited";
  else if (sector === "IT") companyType = "Technologies Limited";
  else if (sector === "Automobile") companyType = "Motors Limited";
  else if (sector === "Infrastructure") companyType = "Infrastructure & Construction Ltd";

  const name = cleanSymbol.startsWith("TATA") 
    ? `Tata ${cleanSymbol.substring(4) || "Global"} ${companyType}`
    : `${cleanSymbol.charAt(0) + cleanSymbol.slice(1).toLowerCase()} ${companyType}`;

  return {
    symbol: cleanSymbol,
    name,
    sector,
    exchange,
    price,
    marketCap
  };
}
