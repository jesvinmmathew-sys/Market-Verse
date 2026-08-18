import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { 
  Briefcase, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  Search, 
  ArrowUpDown, 
  X, 
  Info, 
  PieChart as PieIcon, 
  Check, 
  Calculator, 
  ChevronRight, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  FileText,
  AlertTriangle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts";
import { marketApi } from "../services/marketApi";
import { TradingService } from "../services/trading";
import { INDIAN_STOCK_UNIVERSE } from "../services/indianStocksDb";
import { Stock } from "../types";

// Import custom sub-components
import { PortfolioScanning } from "./portfolio/PortfolioScanning";
import { PortfolioHealthGauge } from "./portfolio/PortfolioHealthGauge";
import { PortfolioMetrics } from "./portfolio/PortfolioMetrics";
import { PortfolioStockCard } from "./portfolio/PortfolioStockCard";
import { PortfolioSectorAnalysis } from "./portfolio/PortfolioSectorAnalysis";

// Types for Portfolio Analyzer
interface CustomHolding {
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  initialPrice: number;
  sector: string;
}

interface PortfolioAnalyzerProps {
  onNavigate: (path: string) => void;
}

export default function PortfolioAnalyzer({ onNavigate }: PortfolioAnalyzerProps) {
  // Saved custom portfolio state
  const [customPortfolio, setCustomPortfolio] = useState<CustomHolding[]>(() => {
    try {
      const stored = localStorage.getItem("marketverse_custom_portfolio");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Ticking live stocks from API
  const [liveStocks, setLiveStocks] = useState<Stock[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  // Interface states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"cards" | "ledger">("cards");
  const [confirmReset, setConfirmReset] = useState(false);

  // AI report & Market Data Warning States
  const [isAIReportLoading, setIsAIReportLoading] = useState(false);
  const [aiReportData, setAiReportData] = useState<any | null>(null);
  const [marketDataWarning, setMarketDataWarning] = useState("");

  // Manual input form states
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualShares, setManualShares] = useState<number | "">("");
  const [manualPrice, setManualPrice] = useState<number | "">("");
  const [manualList, setManualList] = useState<Omit<CustomHolding, "currentPrice">[]>([]);
  const [symbolSuggestions, setSymbolSuggestions] = useState<typeof INDIAN_STOCK_UNIVERSE>([]);

  // Search, sorting and filtering in holdings table
  const [tableSearch, setTableSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortField, setSortField] = useState<string>("value");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // What-If Simulator inputs
  const [simSymbol, setSimSymbol] = useState("");
  const [simAmount, setSimAmount] = useState<number | "">("");
  const [simSuggestions, setSimSuggestions] = useState<typeof INDIAN_STOCK_UNIVERSE>([]);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Initial and ticking quotes subscription
  useEffect(() => {
    let active = true;
    
    const loadQuotes = async () => {
      try {
        const all = await marketApi.getAllStocks();
        if (active) {
          setLiveStocks(all);
          setIsLiveLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch initial stocks:", err);
      }
    };

    loadQuotes();

    const interval = setInterval(async () => {
      const updated = marketApi.tickMarketPrices();
      if (active) {
        setLiveStocks(updated);
      }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Symbol suggestions lookup
  useEffect(() => {
    const q = manualSymbol.trim().toUpperCase();
    if (q.length > 0) {
      const filtered = INDIAN_STOCK_UNIVERSE.filter(item => 
        item.symbol.includes(q) || item.name.toUpperCase().includes(q)
      ).slice(0, 5);
      setSymbolSuggestions(filtered);
    } else {
      setSymbolSuggestions([]);
    }
  }, [manualSymbol]);

  useEffect(() => {
    const q = simSymbol.trim().toUpperCase();
    if (q.length > 0) {
      const filtered = INDIAN_STOCK_UNIVERSE.filter(item => 
        item.symbol.includes(q) || item.name.toUpperCase().includes(q)
      ).slice(0, 5);
      setSimSuggestions(filtered);
    } else {
      setSimSuggestions([]);
    }
  }, [simSymbol]);

  // Clean and map imported holdings against dynamic nse database
  const mapImportedHoldings = (rawList: { symbol: string; shares: number; avgBuyPrice: number }[]): CustomHolding[] => {
    return rawList.map(item => {
      const cleanSym = item.symbol.toUpperCase().trim();
      const nseStock = INDIAN_STOCK_UNIVERSE.find(s => s.symbol === cleanSym);
      
      const companyName = nseStock ? nseStock.name : `${cleanSym} India`;
      const sector = nseStock ? nseStock.sector : inferSectorFromName(companyName);
      const initialPrice = nseStock ? nseStock.price : (100 + Math.floor(Math.random() * 2000));

      return {
        symbol: cleanSym,
        name: companyName,
        shares: item.shares,
        avgBuyPrice: item.avgBuyPrice,
        initialPrice,
        sector
      };
    });
  };

  const inferSectorFromName = (name: string): string => {
    const upper = name.toUpperCase();
    if (upper.includes("BANK") || upper.includes("FINANCE") || upper.includes("HOUSING") || upper.includes("INSURANCE") || upper.includes("SBI")) return "Finance";
    if (upper.includes("TECH") || upper.includes("SOFTWARE") || upper.includes("TCS") || upper.includes("INFOSYS") || upper.includes("WIPRO")) return "IT";
    if (upper.includes("PHARMA") || upper.includes("DRUG") || upper.includes("HEALTH") || upper.includes("LAB")) return "Pharma";
    if (upper.includes("MOTOR") || upper.includes("TATA MOTORS") || upper.includes("AUTO") || upper.includes("MARUTI")) return "Automobile";
    if (upper.includes("POWER") || upper.includes("ENERGY") || upper.includes("OIL") || upper.includes("RELIANCE") || upper.includes("GAS")) return "Energy";
    if (upper.includes("FOOD") || upper.includes("CONSUMER") || upper.includes("BEVERAGE") || upper.includes("UNILEVER") || upper.includes("ITC")) return "FMCG";
    if (upper.includes("METAL") || upper.includes("STEEL") || upper.includes("IRON") || upper.includes("COAL")) return "Metals";
    if (upper.includes("AIRTEL") || upper.includes("TELECOM") || upper.includes("BHARTI")) return "Telecom";
    return "Others";
  };

  // Fetch basic stock prices with 10-second timeout, skipping individual stock failures
  const fetchBasicPricesForSymbols = async (symbols: string[]): Promise<void> => {
    if (symbols.length === 0) return;

    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("TIMEOUT"));
      }, 10000); // 10 seconds timeout limit
    });

    const fetchPromises = symbols.map(async (symbol) => {
      try {
        const stock = await marketApi.getStockBySymbol(symbol);
        if (stock) {
          setLiveStocks((prev) => {
            const exists = prev.some((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
            if (exists) {
              return prev.map((s) => (s.symbol.toUpperCase() === symbol.toUpperCase() ? stock : s));
            } else {
              return [...prev, stock];
            }
          });
        }
      } catch (err) {
        console.warn(`[Indian Stock API] Skipping failed individual stock ${symbol}:`, err);
      }
    });

    try {
      await Promise.race([
        Promise.all(fetchPromises),
        timeoutPromise
      ]);
    } catch (err: any) {
      if (err.message === "TIMEOUT") {
        console.warn("[Indian Stock API] Live market data fetch timed out at 10 seconds.");
        setMarketDataWarning("Live market data is taking longer than expected. Displaying available portfolio information.");
        setTimeout(() => setMarketDataWarning(""), 10000); // Clear after 10 seconds
      } else {
        throw err;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Asynchronous AI report generation in the background
  const generateAIReportAsync = async (holdings: any[], metrics: any, sectorChart: any[], contributors: any) => {
    setIsAIReportLoading(true);
    try {
      // Simulate/perform quantitative background processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let advice = "Your investment portfolio exhibits structural consistency. ";
      const mainSector = sectorChart[0];
      const topHolding = contributors?.largestHolding;
      const topWinner = contributors?.highestReturn;
      
      if (mainSector && mainSector.value > 40) {
        advice += `Your portfolio displays high concentration inside the ${mainSector.name} sector (${mainSector.value.toFixed(1)}%). We recommend systematically diversifying exposure across supplementary defensive categories to insulate against industry-specific corrections. `;
      } else if (sectorChart.length > 0) {
        advice += `Your holdings are excellently diversified across several non-correlated Indian sectors including ${sectorChart.slice(0, 3).map((s: any) => s.name).join(", ")}. This structure acts as an institutional stabilizer against volatile swings in any single counter. `;
      }

      if (topHolding) {
        advice += `Our pipeline identifies ${topHolding.name || topHolding.symbol} (${topHolding.symbol}) as your largest capital anchor representing ₹${topHolding.currentValue.toLocaleString("en-IN")} (${((topHolding.currentValue / metrics.currentPortfolioValue) * 100).toFixed(1)}% of total assets). `;
      }

      if (topWinner && topWinner.profitLoss > 0) {
        advice += `Our analytics pipeline reports ${topWinner.symbol} as your highest absolute performing vehicle (+${topWinner.profitLossPct.toFixed(1)}% overall returns). Consider locking in partial fractional profits on over-extended charts or trailing stop losses to protect your equity floor. `;
      }

      if (metrics.healthScore > 85) {
        advice += `With a dynamic Health Score of ${metrics.healthScore}/100, the structural rating remains Highly Constructive. The general long-term outlook is Positive, backed by healthy moving average barriers of core holding components. `;
      } else if (metrics.healthScore < 60) {
        advice += `Your Health Score of ${metrics.healthScore}/100 flags moderate technical caution. Slower moving average velocity and high-beta exposure require active capital management. Consider shifting positions toward large-cap defensive counters. `;
      } else {
        advice += `The combined technical trajectory prints a solid Health Rating of ${metrics.healthScore}/100. Maintaining average risk thresholds, this portfolio is well-positioned for broad benchmark expansion cycles. `;
      }

      const worstHolding = contributors?.highestRisk;
      const bestHolding = contributors?.highestReturn;

      const report = {
        executiveSummary: advice,
        strengths: [
          metrics.healthScore > 75 ? "Excellent core health indicating robust fundamental asset selection." : "Satisfactory underlying values with strong capital support.",
          sectorChart.length >= 3 ? "Healthy multi-sector presence insulating against industry shocks." : "High specialization within leading strategic Indian vectors.",
          bestHolding ? `${bestHolding.symbol} is displaying stellar relative strength (+${bestHolding.profitLossPct.toFixed(1)}% returns).` : "Consistent performance tracking across primary counters."
        ],
        weaknesses: [
          sectorChart.length < 3 ? "Concentration in limited sector corridors poses correction risks." : "Slight exposure to sector-specific cyclical consolidations.",
          worstHolding ? `${worstHolding.symbol} exhibits downward momentum. Buy average is currently higher than spot price.` : "Requires additional hedging inside standard defensive indexes.",
          "Cash buffer levels are unoptimized within local demat allocations."
        ],
        riskFactors: [
          "Volatility risk: Broad NIFTY index fluctuations directly impacting aggregate beta.",
          "Asset allocation skew: Over-weight positions in top holdings.",
          "Sector rotation: Short-term profit taking across heavily-bought groups."
        ],
        recommendations: [
          "Diversify systematically: Allocate incremental cash into defensive sectors (FMCG, Pharma).",
          "Average down underperformers: If fundamentals remain intact, lower the cost bounds for lagging assets.",
          "Lock partial gains: Rebalance assets when any single holding exceeds 25% of total value."
        ],
        actionPlan: [
          "Phase 1 (Immediate): Establish rigid stop-losses around current key pivot points.",
          "Phase 2 (Month 1): Deploy uncommitted funds in high-beta dip opportunities.",
          "Phase 3 (Quarterly): Audit sector weights relative to NSE sectoral indices."
        ]
      };

      setAiReportData(report);
    } catch (err) {
      console.error("Failed to generate AI report asynchronously:", err);
    } finally {
      setIsAIReportLoading(false);
    }
  };

  // Sync custom portfolio changes with localStorage and trigger event dispatching
  useEffect(() => {
    if (customPortfolio.length > 0) {
      localStorage.setItem("marketverse_custom_portfolio", JSON.stringify(customPortfolio));
      window.dispatchEvent(new Event("aura_portfolio_updated"));
    } else if (customPortfolio.length === 0) {
      localStorage.removeItem("marketverse_custom_portfolio");
      window.dispatchEvent(new Event("aura_portfolio_updated"));
    }
  }, [customPortfolio]);

  // Reset or initialize AI report whenever custom portfolio changes (upload, manual edits, etc.)
  useEffect(() => {
    setAiReportData(null);
    setIsAIReportLoading(false);
  }, [customPortfolio]);

  // Run analyzing transition
  const triggerAnalysis = async (parsedList: { symbol: string; shares: number; avgBuyPrice: number }[]) => {
    setIsAnalyzing(true);
    setUploadError("");
    setMarketDataWarning("");
    setAiReportData(null);
    setIsAIReportLoading(false);

    try {
      const finalHoldings = mapImportedHoldings(parsedList);
      setManualList([]); // Clear temporary form state

      // Fetch basic stock prices for all symbols in parallel (with 10-second timeout limit)
      const symbolsToFetch = finalHoldings.map((h) => h.symbol);
      await fetchBasicPricesForSymbols(symbolsToFetch);

      setCustomPortfolio(finalHoldings);
    } catch (err: any) {
      console.error("Error during portfolio analysis trigger:", err);
      setUploadError(err.message || "Failed to process portfolio holdings.");
      setIsAnalyzing(false); // ALWAYS stop loading state if mapper or API fails!
    }
  };

  const handleScanningComplete = () => {
    setIsAnalyzing(false);
  };

  // CSV parsing logic
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length === 0) {
          throw new Error("CSV file is empty");
        }

        // Detect columns from headers
        const headers = lines[0].split(",").map(h => h.trim().toUpperCase());
        const hasHeaders = headers.some(h => h.includes("SYMBOL") || h.includes("QTY") || h.includes("PRICE") || h.includes("AVERAGE"));
        
        let symbolIdx = 0;
        let qtyIdx = 1;
        let priceIdx = 2;

        let startIndex = 0;
        if (hasHeaders) {
          startIndex = 1;
          const sIdx = headers.findIndex(h => h.includes("SYMBOL") || h.includes("TICKER"));
          const qIdx = headers.findIndex(h => h.includes("QTY") || h.includes("QUANTITY") || h.includes("SHARES"));
          const pIdx = headers.findIndex(h => h.includes("PRICE") || h.includes("AVG") || h.includes("BUY") || h.includes("COST"));
          
          if (sIdx !== -1) symbolIdx = sIdx;
          if (qIdx !== -1) qtyIdx = qIdx;
          if (pIdx !== -1) priceIdx = pIdx;
        }

        const parsedList = [];
        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim());
          if (cols.length >= 3) {
            const symbol = cols[symbolIdx]?.toUpperCase() || "";
            const shares = parseFloat(cols[qtyIdx]) || 0;
            const avgBuyPrice = parseFloat(cols[priceIdx]) || 0;
            
            if (symbol && shares > 0 && avgBuyPrice > 0) {
              parsedList.push({ symbol, shares, avgBuyPrice });
            }
          }
        }

        if (parsedList.length === 0) {
          throw new Error("No valid holdings parsed. Please check headers: Symbol, Quantity, Average Price.");
        }

        triggerAnalysis(parsedList);
      } catch (err: any) {
        setUploadError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Excel parsing logic
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length === 0) {
          throw new Error("Worksheet is empty");
        }

        let symbolIdx = -1;
        let qtyIdx = -1;
        let priceIdx = -1;

        // Check if any of the first 3 rows is a header row
        const headerRowIdx = data.slice(0, 3).findIndex(row => 
          Array.isArray(row) && row.some(cell => {
            const str = String(cell).toUpperCase();
            return str.includes("SYMBOL") || str.includes("QTY") || str.includes("QUANTITY") || str.includes("PRICE") || str.includes("AVG");
          })
        );

        let startIndex = 0;
        if (headerRowIdx !== -1) {
          startIndex = headerRowIdx + 1;
          const headers = data[headerRowIdx].map(h => String(h).trim().toUpperCase());
          symbolIdx = headers.findIndex(h => h.includes("SYMBOL") || h.includes("STOCK") || h.includes("TICKER"));
          qtyIdx = headers.findIndex(h => h.includes("QTY") || h.includes("QUANTITY") || h.includes("SHARES"));
          priceIdx = headers.findIndex(h => h.includes("PRICE") || h.includes("AVG") || h.includes("BUY") || h.includes("COST"));
        }

        if (symbolIdx === -1) symbolIdx = 0;
        if (qtyIdx === -1) qtyIdx = 1;
        if (priceIdx === -1) priceIdx = 2;

        const parsedList = [];
        for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (Array.isArray(row) && row.length >= 3) {
            const symbol = String(row[symbolIdx] || "").trim().toUpperCase();
            const shares = parseFloat(row[qtyIdx]) || 0;
            const avgBuyPrice = parseFloat(row[priceIdx]) || 0;

            if (symbol && symbol !== "UNDEFINED" && shares > 0 && avgBuyPrice > 0) {
              parsedList.push({ symbol, shares, avgBuyPrice });
            }
          }
        }

        if (parsedList.length === 0) {
          throw new Error("No valid records found in worksheet. Check columns matching Symbol, Quantity, Average Price.");
        }

        triggerAnalysis(parsedList);
      } catch (err: any) {
        setUploadError(err.message || "Failed to parse Excel workbook.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Manual input list actions
  const addManualStock = () => {
    if (!manualSymbol) {
      setUploadError("Please provide a stock symbol.");
      return;
    }
    const sharesNum = Number(manualShares);
    const priceNum = Number(manualPrice);

    if (isNaN(sharesNum) || sharesNum <= 0) {
      setUploadError("Please provide a valid quantity.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setUploadError("Please provide a valid buy price.");
      return;
    }

    const cleanSym = manualSymbol.toUpperCase().trim();
    const existingIdx = manualList.findIndex(m => m.symbol === cleanSym);
    const nseMeta = INDIAN_STOCK_UNIVERSE.find(s => s.symbol === cleanSym);

    const name = nseMeta ? nseMeta.name : `${cleanSym} India`;
    const sector = nseMeta ? nseMeta.sector : inferSectorFromName(name);
    const initialPrice = nseMeta ? nseMeta.price : priceNum;

    if (existingIdx !== -1) {
      // Average out
      const existing = manualList[existingIdx];
      const newShares = existing.shares + sharesNum;
      const newAvgPrice = ((existing.shares * existing.avgBuyPrice) + (sharesNum * priceNum)) / newShares;
      
      const updated = [...manualList];
      updated[existingIdx] = {
        ...existing,
        shares: newShares,
        avgBuyPrice: parseFloat(newAvgPrice.toFixed(2))
      };
      setManualList(updated);
    } else {
      setManualList(prev => [...prev, {
        symbol: cleanSym,
        name,
        shares: sharesNum,
        avgBuyPrice: priceNum,
        initialPrice,
        sector
      }]);
    }

    setManualSymbol("");
    setManualShares("");
    setManualPrice("");
    setUploadError("");
  };

  const removeManualStock = (index: number) => {
    setManualList(prev => prev.filter((_, idx) => idx !== index));
  };

  const saveManualPortfolio = () => {
    if (manualList.length === 0) {
      setUploadError("Add at least one stock to continue.");
      return;
    }
    triggerAnalysis(manualList);
  };

  const resetPortfolio = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto-revert the confirmation state after 4 seconds if not clicked again
      setTimeout(() => {
        setConfirmReset(false);
      }, 4000);
      return;
    }

    setCustomPortfolio([]);
    setManualList([]);
    setUploadError("");
    setIsAnalyzing(false);
    setIsSimulatorOpen(false);
    setConfirmReset(false);
    localStorage.removeItem("marketverse_portfolio");
    localStorage.removeItem("marketverse_custom_portfolio");
    TradingService.resetAccount();
  };

  // Computations with LIVE tickers
  const processedHoldings = useMemo(() => {
    return customPortfolio.map(item => {
      const liveStock = liveStocks.find(s => s.symbol.toUpperCase() === item.symbol.toUpperCase());
      const currentPrice = liveStock ? liveStock.price : item.initialPrice;
      const percentChange = liveStock ? liveStock.percentChange : 0;
      const change = liveStock ? liveStock.change : 0;
      
      const costValue = item.shares * item.avgBuyPrice;
      const currentValue = item.shares * currentPrice;
      const profitLoss = currentValue - costValue;
      const profitLossPct = costValue > 0 ? (profitLoss / costValue) * 100 : 0;

      // Determine technical indicators and risk heuristically if live data is demo
      const hash = item.symbol.charCodeAt(0) + (item.symbol.charCodeAt(1) || 0);
      const bullishPct = Math.floor(45 + (hash % 45));
      const riskLevel = bullishPct > 75 ? "Low" : bullishPct < 55 ? "High" : "Medium";
      const aiSummary = profitLoss >= 0 
        ? `${item.symbol} is trading above your purchase average, displaying strong technical support indicators near ₹${(currentPrice * 0.98).toFixed(1)}.` 
        : `${item.symbol} is currently below average buy price; technical trends suggest short-term consolidative momentum. Monitor key pivots closely.`;

      return {
        ...item,
        currentPrice,
        percentChange,
        change,
        costValue,
        currentValue,
        profitLoss,
        profitLossPct,
        bullishPct,
        riskLevel,
        aiSummary
      };
    });
  }, [customPortfolio, liveStocks]);

  // Dashboard Aggregations
  const summaryMetrics = useMemo(() => {
    if (processedHoldings.length === 0) {
      return {
        totalInvestment: 0,
        currentPortfolioValue: 1000000,
        todaysGainLoss: 0,
        unrealizedProfit: 0,
        overallReturnPct: 0,
        healthScore: 100,
        holdingsCount: 0,
        diversificationRating: "None",
        riskRating: "None",
        outlookRating: "Stable"
      };
    }

    let totalInvestment = 0;
    let currentPortfolioValue = 0;
    let todaysGainLoss = 0;

    processedHoldings.forEach(item => {
      totalInvestment += item.costValue;
      currentPortfolioValue += item.currentValue;
      todaysGainLoss += item.shares * item.change;
    });

    const unrealizedProfit = currentPortfolioValue - totalInvestment;
    const overallReturnPct = totalInvestment > 0 ? (unrealizedProfit / totalInvestment) * 100 : 0;
    
    // Deterministic Portfolio Health Score based on diversification, returns and volatility
    const sectors = new Set(processedHoldings.map(h => h.sector));
    const sectorCount = sectors.size;
    const holdCount = processedHoldings.length;
    
    let baseScore = 70;
    if (sectorCount >= 4) baseScore += 15; // diversification bonus
    else if (sectorCount === 1) baseScore -= 15; // single sector penalty

    if (overallReturnPct > 15) baseScore += 10;
    else if (overallReturnPct < -10) baseScore -= 10;

    if (holdCount >= 6) baseScore += 5;
    
    const healthScore = Math.min(98, Math.max(35, baseScore));

    const diversificationRating = sectorCount >= 4 ? "Excellent" : sectorCount >= 2 ? "Good" : "Concentrated";
    const riskRating = overallReturnPct > 20 ? "High" : healthScore > 80 ? "Medium" : "High";
    const outlookRating = healthScore > 75 ? "Positive" : healthScore > 50 ? "Neutral" : "Caution";

    return {
      totalInvestment,
      currentPortfolioValue,
      todaysGainLoss,
      unrealizedProfit,
      overallReturnPct,
      healthScore,
      holdingsCount: holdCount,
      diversificationRating,
      riskRating,
      outlookRating
    };
  }, [processedHoldings]);

  // Sector Distribution Chart Data
  const sectorChartData = useMemo(() => {
    const map: Record<string, number> = {};
    processedHoldings.forEach(h => {
      map[h.sector] = (map[h.sector] || 0) + h.currentValue;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map).map(([sector, value]) => ({
      name: sector,
      value,
      percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.value - a.value);
  }, [processedHoldings]);

  // Top Holdings Bar Chart Data
  const topHoldingsChartData = useMemo(() => {
    return [...processedHoldings]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5)
      .map(h => ({
        name: h.symbol,
        Value: parseFloat(h.currentValue.toFixed(1)),
        Cost: parseFloat(h.costValue.toFixed(1)),
        Profit: parseFloat(h.profitLoss.toFixed(1))
      }));
  }, [processedHoldings]);

  // Top Winners and Losers / Bento metrics
  const topContributors = useMemo(() => {
    if (processedHoldings.length === 0) return null;

    const sortedByReturns = [...processedHoldings].sort((a, b) => b.profitLoss - a.profitLoss);
    const sortedByPct = [...processedHoldings].sort((a, b) => b.profitLossPct - a.profitLossPct);
    const sortedByValue = [...processedHoldings].sort((a, b) => b.currentValue - a.currentValue);
    const sortedByRisk = [...processedHoldings].sort((a, b) => b.bullishPct - a.bullishPct); // lower bullish score implies higher risk level

    return {
      topWinners: sortedByReturns.slice(0, 5).filter(h => h.profitLoss > 0),
      topLosers: [...sortedByReturns].reverse().slice(0, 5).filter(h => h.profitLoss < 0),
      largestHolding: sortedByValue[0],
      smallestHolding: sortedByValue[sortedByValue.length - 1],
      highestReturn: sortedByPct[0],
      highestRisk: sortedByRisk[sortedByRisk.length - 1]
    };
  }, [processedHoldings]);

  // Filter & Search holdings list
  const filteredHoldings = useMemo(() => {
    return processedHoldings.filter(h => {
      const matchSearch = h.symbol.toLowerCase().includes(tableSearch.toLowerCase()) || 
                          h.name.toLowerCase().includes(tableSearch.toLowerCase());
      const matchSector = sectorFilter === "All" || h.sector === sectorFilter;
      const matchRisk = riskFilter === "All" || h.riskLevel === riskFilter;

      return matchSearch && matchSector && matchRisk;
    }).sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];

      // Handle nulls
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;

      if (typeof valA === "string") {
        return sortDirection === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc" 
          ? valA - valB 
          : valB - valA;
      }
    });
  }, [processedHoldings, tableSearch, sectorFilter, riskFilter, sortField, sortDirection]);

  // Unique sectors for filter dropdown
  const uniqueSectors = useMemo(() => {
    const set = new Set(processedHoldings.map(h => h.sector));
    return Array.from(set);
  }, [processedHoldings]);

  // NOVA dynamic portfolio report paragraph generation
  const generatedNovaIntelligence = useMemo(() => {
    if (processedHoldings.length === 0 || !summaryMetrics) return "";

    const sectorWeights = sectorChartData;
    const mainSector = sectorWeights[0];
    const topHolding = topContributors?.largestHolding;
    const topWinner = topContributors?.highestReturn;
    
    let advice = "Your investment portfolio exhibits structural consistency. ";
    
    if (mainSector && mainSector.percentage > 40) {
      advice += `Your portfolio displays high concentration inside the ${mainSector.name} sector (${mainSector.percentage}%). We recommend systematically diversifying exposure across supplementary defensive categories to insulate against industry-specific corrections. `;
    } else {
      advice += `Your holdings are excellently diversified across several non-correlated Indian sectors including ${sectorWeights.slice(0, 3).map(s => s.name).join(", ")}. This structure acts as an institutional stabilizer against volatile swings in any single counter. `;
    }

    if (topHolding) {
      advice += `Our pipeline identifies ${topHolding.name} (${topHolding.symbol}) as your largest capital anchor representing ₹${topHolding.currentValue.toLocaleString("en-IN")} (${((topHolding.currentValue / summaryMetrics.currentPortfolioValue) * 100).toFixed(1)}% of total assets). `;
    }

    if (topWinner && topWinner.profitLoss > 0) {
      advice += `Our analytics pipeline reports ${topWinner.symbol} as your highest absolute performing vehicle (+${topWinner.profitLossPct.toFixed(1)}% overall returns). Consider locking in partial fractional profits on over-extended charts or trailing stop losses to protect your equity floor. `;
    }

    if (summaryMetrics.healthScore > 85) {
      advice += `With a dynamic Health Score of ${summaryMetrics.healthScore}/100, the structural rating remains Highly Constructive. The general long-term outlook is Positive, backed by healthy moving average barriers of core holding components. `;
    } else if (summaryMetrics.healthScore < 60) {
      advice += `Your Health Score of ${summaryMetrics.healthScore}/100 flags moderate technical caution. Slower moving average velocity and high-beta exposure require active capital management. Consider shifting positions toward large-cap defensive counters. `;
    } else {
      advice += `The combined technical trajectory prints a solid Health Rating of ${summaryMetrics.healthScore}/100. Maintaining average risk thresholds, this portfolio is well-positioned for broad benchmark expansion cycles. `;
    }

    return advice;
  }, [processedHoldings, summaryMetrics, sectorChartData, topContributors]);

  // What If simulator execution
  const runSimulation = () => {
    if (!simSymbol) return;
    const amountNum = Number(simAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const cleanSimSymbol = simSymbol.toUpperCase().trim();
    const existingStock = INDIAN_STOCK_UNIVERSE.find(s => s.symbol === cleanSimSymbol);

    const price = existingStock ? existingStock.price : 500;
    const name = existingStock ? existingStock.name : `${cleanSimSymbol} India`;
    const sector = existingStock ? existingStock.sector : inferSectorFromName(name);
    const sharesToAdd = parseFloat((amountNum / price).toFixed(2));

    // Calculate new weights
    const tempHoldings = [...customPortfolio];
    const existingIdx = tempHoldings.findIndex(h => h.symbol === cleanSimSymbol);

    if (existingIdx !== -1) {
      const exist = tempHoldings[existingIdx];
      const newShares = exist.shares + sharesToAdd;
      const newAvg = ((exist.shares * exist.avgBuyPrice) + (sharesToAdd * price)) / newShares;
      tempHoldings[existingIdx] = {
        ...exist,
        shares: newShares,
        avgBuyPrice: parseFloat(newAvg.toFixed(2))
      };
    } else {
      tempHoldings.push({
        symbol: cleanSimSymbol,
        name,
        shares: sharesToAdd,
        avgBuyPrice: price,
        initialPrice: price,
        sector
      });
    }

    // Process new aggregate stats
    let newTotalInvestment = 0;
    let newCurrentValue = 0;
    const newSectorMap: Record<string, number> = {};

    tempHoldings.forEach(item => {
      const liveStock = liveStocks.find(s => s.symbol.toUpperCase() === item.symbol.toUpperCase());
      const currentPrice = liveStock ? liveStock.price : item.initialPrice;
      newTotalInvestment += item.shares * item.avgBuyPrice;
      newCurrentValue += item.shares * currentPrice;
      newSectorMap[item.sector] = (newSectorMap[item.sector] || 0) + (item.shares * currentPrice);
    });

    const newSectorsCount = Object.keys(newSectorMap).length;
    let newScore = 72;
    if (newSectorsCount >= 4) newScore += 15;
    else if (newSectorsCount === 1) newScore -= 15;

    const newHealthScore = Math.min(98, Math.max(35, newScore));
    const newSectorWeightPct = ((newSectorMap[sector] || 0) / newCurrentValue) * 100;

    let aiCommentary = `Simulating an investment of **₹${amountNum.toLocaleString("en-IN")}** into **${name}** (${cleanSimSymbol}) at current rate ₹${price.toLocaleString("en-IN")} (adds +${sharesToAdd} shares).\n\n`;
    
    if (existingIdx !== -1) {
      aiCommentary += `This trade would increase your existing concentration in **${cleanSimSymbol}**. `;
    } else {
      aiCommentary += `This allocation introduces a fresh component to your dashboard. `;
    }

    aiCommentary += `Your **${sector}** sector exposure would adjust to **${newSectorWeightPct.toFixed(1)}%** of the entire custom portfolio. `;

    if (newHealthScore > (summaryMetrics?.healthScore || 0)) {
      aiCommentary += `NOVA's core engine evaluates this simulation as **Constructive**. It improves structural diversification metrics and slightly raises your aggregate Health Rating to **${newHealthScore}/100**.`;
    } else {
      aiCommentary += `NOVA's diagnostic analysis notes this increases sector consolidation inside **${sector}**, which slightly softens your aggregate portfolio health score from **${summaryMetrics?.healthScore || 0}/100** to **${newHealthScore}/100**. Consider matching this buy with defensive hedging inside retail or FMCG counters.`;
    }

    setSimResult({
      shares: sharesToAdd,
      price,
      newHealthScore,
      newTotalValue: newCurrentValue,
      newSectorWeight: newSectorWeightPct,
      commentary: aiCommentary
    });
  };

  const colors = ["#06B6D4", "#10B981", "#8B5CF6", "#F59E0B", "#3B82F6", "#EC4899", "#14B8A6", "#EF4444"];

  // Memoized lists of insights and report data
  const quickInsightsList = useMemo(() => {
    if (processedHoldings.length === 0 || !summaryMetrics) return [];
    
    const list = [];
    
    const sectorCount = sectorChartData.length;
    if (sectorCount >= 4) {
      list.push({ text: "Excellent diversification", status: "success" as const, info: "Capital spread elegantly across multiple market sectors." });
    } else if (sectorCount >= 2) {
      list.push({ text: "Moderate diversification", status: "warning" as const, info: "Consider adding 1-2 new sectors to protect capital from cycles." });
    } else {
      list.push({ text: "Concentrated assets", status: "danger" as const, info: "High sector risk. Diversify across uncorrelated businesses." });
    }

    const topSector = sectorChartData[0];
    if (topSector) {
      const hash = topSector.name.charCodeAt(0);
      const bullishScore = Math.floor(65 + (hash % 23));
      if (bullishScore > 75) {
        list.push({ text: `Strong ${topSector.name} momentum`, status: "success" as const, info: `Sector indicators print elevated technical accumulation (Bullish: ${bullishScore}%).` });
      } else {
        list.push({ text: `${topSector.name} sideways consolidation`, status: "warning" as const, info: "Trading inside minor moving averages support corridors." });
      }
    }

    if (topSector && topSector.percentage > 35) {
      list.push({ text: `${topSector.name} allocation high`, status: "warning" as const, info: `Constitutes ${topSector.percentage.toFixed(1)}% of total net holdings.` });
    } else {
      list.push({ text: "Balanced sector exposure", status: "success" as const, info: "Sector weightings match stable long-term benchmarks." });
    }

    const worstHolding = topContributors?.highestRisk;
    if (worstHolding && worstHolding.bullishPct < 55) {
      list.push({ text: `Monitor ${worstHolding.symbol}`, status: "danger" as const, info: `Below support buy lines. Downward technical pressures.` });
    } else {
      list.push({ text: "Asset-level support strong", status: "success" as const, info: "Core positions are consistently sitting above key support bounds." });
    }

    if (summaryMetrics.healthScore > 75) {
      list.push({ text: "Long-term outlook positive", status: "success" as const, info: "Fundamentals suggest solid compounding capabilities." });
    } else {
      list.push({ text: "Cautious defensive posture", status: "warning" as const, info: "Hedge with large-cap defensive blue-chip assets." });
    }

    return list.slice(0, 5);
  }, [processedHoldings, summaryMetrics, sectorChartData, topContributors]);

  const fullReportData = useMemo(() => {
    if (processedHoldings.length === 0 || !summaryMetrics) return null;
    
    const worstHolding = topContributors?.highestRisk;
    const bestHolding = topContributors?.highestReturn;

    return {
      executiveSummary: generatedNovaIntelligence,
      strengths: [
        summaryMetrics.healthScore > 75 ? "Excellent core health indicating robust fundamental asset selection." : "Satisfactory underlying values with strong capital support.",
        sectorChartData.length >= 3 ? "Healthy multi-sector presence insulating against industry shocks." : "High specialization within leading strategic Indian vectors.",
        bestHolding ? `${bestHolding.symbol} is displaying stellar relative strength (+${bestHolding.profitLossPct.toFixed(1)}% returns).` : "Consistent performance tracking across primary counters."
      ],
      weaknesses: [
        sectorChartData.length < 3 ? "Concentration in limited sector corridors poses correction risks." : "Slight exposure to sector-specific cyclical consolidations.",
        worstHolding ? `${worstHolding.symbol} exhibits downward momentum. Buy average is currently higher than spot price.` : "Requires additional hedging inside standard defensive indexes.",
        "Cash buffer levels are unoptimized within local demat allocations."
      ],
      riskFactors: [
        "Volatility risk: Broad NIFTY index fluctuations directly impacting aggregate beta.",
        "Asset allocation skew: Over-weight positions in top holdings.",
        "Sector rotation: Short-term profit taking across heavily-bought groups."
      ],
      recommendations: [
        "Diversify systematically: Allocate incremental cash into defensive sectors (FMCG, Pharma).",
        "Average down underperformers: If fundamentals remain intact, lower the cost bounds for lagging assets.",
        "Lock partial gains: Rebalance assets when any single holding exceeds 25% of total value."
      ],
      actionPlan: [
        "Phase 1 (Immediate): Establish rigid stop-losses around current key pivot points.",
        "Phase 2 (Month 1): Deploy uncommitted funds in high-beta dip opportunities.",
        "Phase 3 (Quarterly): Audit sector weights relative to NSE sectoral indices."
      ]
    };
  }, [processedHoldings, summaryMetrics, sectorChartData, topContributors, generatedNovaIntelligence]);

  // Decoupled background effect to trigger AI analysis without blocking the main rendering pipeline
  useEffect(() => {
    if (processedHoldings.length > 0 && summaryMetrics && !isAnalyzing && !aiReportData && !isAIReportLoading) {
      generateAIReportAsync(processedHoldings, summaryMetrics, sectorChartData, topContributors);
    }
  }, [processedHoldings, summaryMetrics, isAnalyzing, aiReportData, isAIReportLoading, sectorChartData, topContributors]);

  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto px-4 sm:px-6 py-4" id="portfolio-analyzer-container">
      
      {/* 1. CINEMATIC SCANNING OVERLAY MODAL */}
      <PortfolioScanning 
        isAnalyzing={isAnalyzing} 
        holdingsCount={customPortfolio.length || manualList.length} 
        onComplete={handleScanningComplete} 
      />

      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto py-4 space-y-3" id="portfolio-hero">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-[10px] font-mono tracking-widest uppercase font-bold">
          <Briefcase className="w-3 h-3" />
          <span>Nova Institutional Engine 2.0</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-300 to-white/70 bg-clip-text text-transparent font-sans">
          Portfolio Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-white/65 font-sans leading-relaxed">
          Upload your broker sheets or manually audit positions to experience premium quantitative analytics, sector rotation maps, and custom AI diagnostics.
        </p>
      </div>

      {/* RENDER FORM / UPLOADS WHEN PORTFOLIO IS EMPTY */}
      {processedHoldings.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" id="import-cards-grid">
          {/* Card 1: CSV Upload */}
          <div className="liquid-glass border border-white/5 bg-black/30 hover:border-cyan-400/25 rounded-2xl p-6 space-y-4 transition-all hover:bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Upload CSV</h3>
                <p className="text-[10px] text-white/40">Accepts standard .csv files</p>
              </div>
            </div>
            
            <p className="text-[11px] text-white/60 leading-relaxed font-sans text-left">
              Provide a comma-separated file with specific columns: <strong className="text-white">Symbol, Quantity, Average Price</strong>.
            </p>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 font-mono text-[10px] text-white/50 space-y-1.5 text-left">
              <div className="text-[9px] text-white/35 uppercase tracking-wider border-b border-white/5 pb-1 mb-1 font-bold">File structure example:</div>
              <div>RELIANCE,10,2650</div>
              <div>TCS,5,3850</div>
              <div>INFY,15,1450</div>
            </div>

            <label className="relative flex flex-col items-center justify-center h-28 border border-dashed border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] hover:border-cyan-400/30 cursor-pointer transition-all">
              <div className="flex flex-col items-center justify-center space-y-2 text-center px-4">
                <UploadCloud className="w-6 h-6 text-white/40 animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-white/60">Choose file or drag and drop</span>
                <span className="text-[9px] text-white/30">Max 5MB</span>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCSVUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Card 2: Excel Upload */}
          <div className="liquid-glass border border-white/5 bg-black/30 hover:border-cyan-400/25 rounded-2xl p-6 space-y-4 transition-all hover:bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Upload Excel</h3>
                <p className="text-[10px] text-white/40">Accepts .xlsx and .xls sheets</p>
              </div>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed font-sans text-left">
              Import directly from any spreadsheet worksheet. Column mapping detects headers containing <strong className="text-white">Symbol, Shares, or Average Price</strong> automatically.
            </p>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 font-mono text-[10px] text-white/50 space-y-1.5 text-left">
              <div className="text-[9px] text-white/35 uppercase tracking-wider border-b border-white/5 pb-1 mb-1 font-bold">Supported Formats:</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                <span>Standard demat broker ledger exports</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                <span>Custom financial modeling grids</span>
              </div>
            </div>

            <label className="relative flex flex-col items-center justify-center h-28 border border-dashed border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] hover:border-purple-400/30 cursor-pointer transition-all">
              <div className="flex flex-col items-center justify-center space-y-2 text-center px-4">
                <UploadCloud className="w-6 h-6 text-white/40 animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-white/60">Choose sheet spreadsheet</span>
                <span className="text-[9px] text-white/30">Excel 97-2023 Workbooks</span>
              </div>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleExcelUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Card 3: Manual Input */}
          <div className="liquid-glass border border-white/5 bg-black/30 hover:border-cyan-400/25 rounded-2xl p-6 space-y-4 transition-all hover:bg-white/[0.01] lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Manual Demat</h3>
                <p className="text-[10px] text-white/40">Build and customize manually</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Symbol input with suggestions */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Stock Symbol (e.g. RELIANCE)"
                  value={manualSymbol}
                  onChange={(e) => setManualSymbol(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-cyan-400/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder-white/20 font-mono uppercase"
                />
                {symbolSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#0d0f14]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {symbolSuggestions.map(s => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          setManualSymbol(s.symbol);
                          setSymbolSuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 text-[11px] flex justify-between items-center border-b border-white/5 cursor-pointer font-mono text-white/80"
                      >
                        <span className="font-bold text-cyan-400 font-mono">{s.symbol}</span>
                        <span className="text-white/40 truncate text-right max-w-[150px] font-sans">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity and Price fields side by side */}
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number"
                  placeholder="Quantity"
                  value={manualShares}
                  onChange={(e) => setManualShares(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-cyan-400/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none placeholder-white/20 font-mono"
                />
                <input 
                  type="number"
                  placeholder="Buy Price (₹)"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-cyan-400/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none placeholder-white/20 font-mono"
                />
              </div>

              <button
                onClick={addManualStock}
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 py-2.5 rounded-xl text-xs font-bold text-amber-300 uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stock</span>
              </button>
            </div>

            {/* Temporary manually added list */}
            {manualList.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-[9px] uppercase tracking-widest text-white/45 font-bold font-mono text-left">Demat Queue ({manualList.length})</div>
                <div className="max-h-36 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5 bg-white/[0.01]">
                  {manualList.map((item, index) => (
                    <div key={item.symbol} className="p-2.5 px-3 flex items-center justify-between text-[11px] font-mono text-left">
                      <div>
                        <span className="font-bold text-white">{item.symbol}</span>
                        <span className="text-white/40 text-[9px] ml-2 font-sans">{item.shares} shares @ ₹{item.avgBuyPrice}</span>
                      </div>
                      <button 
                        onClick={() => removeManualStock(index)}
                        className="text-rose-400 hover:text-rose-300 p-1 bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveManualPortfolio}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Portfolio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* PORTFOLIO DASHBOARD PANELS */
        /* ========================================================= */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-8" 
          id="portfolio-main-dashboard"
        >
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <div className="text-xs text-white/50 font-mono tracking-widest uppercase text-left">
                Active Client Portfolio Verified • Quantum Terminal 2.0
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/30 text-violet-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Calculator className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
                <span>What-If Simulator</span>
              </button>
              
              <button
                onClick={resetPortfolio}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  confirmReset 
                    ? "bg-rose-600 hover:bg-rose-700 border border-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]" 
                    : "bg-white/5 hover:bg-white/10 border border-white/5 text-white/80"
                }`}
              >
                <Trash2 className={`w-4 h-4 ${confirmReset ? "text-white" : "text-rose-400"}`} />
                <span>{confirmReset ? "Click to Confirm" : "Reset Portfolio"}</span>
              </button>
            </div>
          </div>

          {/* Warning banner if basic stocks timed out */}
          {marketDataWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2 mb-6 font-mono text-left">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>{marketDataWarning}</span>
            </div>
          )}

          {/* 4, 5, 6. METRICS CARDS, QUICK INSIGHTS & EXPANDABLE REPORT */}
          {summaryMetrics && (
            <PortfolioMetrics 
              summaryMetrics={summaryMetrics} 
              quickInsights={quickInsightsList} 
              fullReportData={aiReportData} 
              isAIReportLoading={isAIReportLoading}
            />
          )}

          {/* TWO COLUMN PERFORMANCE & ALLOCATION CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-and-score-section">
            
            {/* Left: Portfolio health score circular gauge and report (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {summaryMetrics && (
                <PortfolioHealthGauge 
                  score={summaryMetrics.healthScore} 
                  diversification={summaryMetrics.diversificationRating} 
                  risk={summaryMetrics.riskRating} 
                  outlook={summaryMetrics.outlookRating} 
                />
              )}
            </div>

            {/* Right: Portfolio Allocation & Performance Chart (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Sector Allocation Pie Chart */}
              <div className="liquid-glass border border-white/5 rounded-2xl p-5 space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-mono tracking-widest text-white/50 font-bold">Sector Asset Allocation</h3>
                  <PieIcon className="w-4 h-4 text-cyan-400" />
                </div>
                
                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={1200}
                      >
                        {sectorChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0e1117", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                        itemStyle={{ color: "#fff", fontSize: "11px", fontFamily: "sans-serif" }}
                        formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Holdings performance */}
              <div className="liquid-glass border border-white/5 rounded-2xl p-5 space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-mono tracking-widest text-white/50 font-bold">Top Holdings Valuation</h3>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topHoldingsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "9px", fontFamily: "monospace" }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: "9px", fontFamily: "monospace" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1117", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                        itemStyle={{ fontSize: "11px" }}
                        formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`}
                      />
                      <Bar dataKey="Cost" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                      <Bar dataKey="Value" fill="#06B6D4" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* 10. SECTOR PERFORMANCE MATRIX CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6" id="sector-grid-section">
            <PortfolioSectorAnalysis sectorData={sectorChartData} />
          </div>

          {/* DYNAMIC HOLDINGS STACK & LEDGER TABLE */}
          <div className="liquid-glass border border-white/5 rounded-2xl p-6 space-y-5" id="portfolio-holdings-table-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="text-left">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Demat Holdings Ledger</h2>
                <p className="text-[10px] text-white/40">Audit ledger matching active NSE transaction indexes</p>
              </div>

              {/* Tab togglers & Filtering bar */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Visual View toggler */}
                <div className="flex items-center bg-white/5 border border-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setDashboardTab("cards")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${dashboardTab === "cards" ? "bg-cyan-500 text-black shadow-lg" : "text-white/60 hover:text-white"}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setDashboardTab("ledger")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${dashboardTab === "ledger" ? "bg-cyan-500 text-black shadow-lg" : "text-white/60 hover:text-white"}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-white/10 hidden sm:block" />

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search holdings..." 
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-400/40 w-40 font-sans"
                  />
                </div>

                {/* Sector filter */}
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 focus:outline-none focus:border-cyan-400/40 cursor-pointer font-sans"
                >
                  <option value="All">All Sectors</option>
                  {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Risk filter */}
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 focus:outline-none focus:border-cyan-400/40 cursor-pointer font-sans"
                >
                  <option value="All">All Risk</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
            </div>

            {customPortfolio.length === 0 ? (
              <div className="py-12 text-center text-white/35 text-xs font-sans space-y-3 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]" id="ledger-empty-state">
                <Briefcase className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                <p className="font-semibold text-slate-350 text-sm">No open positions.</p>
                <p className="text-[11px] text-slate-500 max-w-[280px] mx-auto leading-normal">
                  Use the Trade Terminal to place your first virtual order.
                </p>
              </div>
            ) : (
              dashboardTab === "cards" ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {filteredHoldings.map((h) => (
                    <PortfolioStockCard key={h.symbol} holding={h} />
                  ))}
                  {filteredHoldings.length === 0 && (
                    <div className="py-12 text-center text-xs text-white/30 italic font-sans col-span-full">
                      No holding component matched the filter settings.
                    </div>
                  )}
                </motion.div>
              ) : (
                /* TAB CONTENT: TABLE / LEDGER VIEW */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="overflow-x-auto"
                >
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-white/5 text-white/45">
                        {[
                          { label: "Company", field: "name" },
                          { label: "Symbol", field: "symbol" },
                          { label: "Current Price", field: "currentPrice" },
                          { label: "Avg Buy Price", field: "avgBuyPrice" },
                          { label: "Quantity", field: "shares" },
                          { label: "Total Cost", field: "costValue" },
                          { label: "Current Value", field: "currentValue" },
                          { label: "Profit / Loss", field: "profitLoss" },
                          { label: "Risk Level", field: "riskLevel" },
                        ].map(col => (
                          <th 
                            key={col.label} 
                            onClick={() => {
                              if (sortField === col.field) {
                                setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                              } else {
                                setSortField(col.field);
                                setSortDirection("desc");
                              }
                            }}
                            className="py-3 px-4 font-bold uppercase tracking-wider text-[9px] cursor-pointer hover:text-white transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{col.label}</span>
                              <ArrowUpDown className="w-3 h-3 text-white/20" />
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[9px] text-cyan-400">NOVA Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredHoldings.map((h) => {
                        const gain = h.profitLoss >= 0;
                        return (
                          <tr key={h.symbol} className="hover:bg-white/[0.01] transition-all text-left">
                            <td className="py-3.5 px-4 font-bold text-white font-sans max-w-[150px] truncate">{h.name}</td>
                            <td className="py-3.5 px-4 font-black text-cyan-300">{h.symbol}</td>
                            <td className="py-3.5 px-4 text-white">₹{h.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</td>
                            <td className="py-3.5 px-4 text-white/60">₹{h.avgBuyPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</td>
                            <td className="py-3.5 px-4 text-white">{h.shares}</td>
                            <td className="py-3.5 px-4 text-white/50">₹{h.costValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="py-3.5 px-4 font-bold text-white">₹{h.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className={`py-3.5 px-4 font-bold ${gain ? "text-emerald-400" : "text-rose-400"}`}>
                              <div className="flex flex-col">
                                <span>{gain ? "+" : ""}₹{h.profitLoss.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</span>
                                <span className="text-[9px]">{gain ? "+" : ""}{h.profitLossPct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase ${h.riskLevel === "Low" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : h.riskLevel === "High" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                                {h.riskLevel}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[10px] text-white/50 max-w-[220px] truncate font-sans italic" title={h.aiSummary}>
                              {h.aiSummary}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredHoldings.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-xs text-white/30 italic font-sans">
                            No holdings found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* WHAT IF SIMULATOR MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="liquid-glass border border-white/10 bg-[#0e1116]/95 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-violet-400 text-sm font-bold uppercase tracking-wider font-mono">
                  <Calculator className="w-4 h-4 animate-bounce" />
                  <span>Demat What-If Simulator</span>
                </div>
                <button 
                  onClick={() => {
                    setIsSimulatorOpen(false);
                    setSimResult(null);
                    setSimSymbol("");
                    setSimAmount("");
                  }}
                  className="p-1 rounded-lg bg-transparent hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form fields */}
              <div className="p-6 space-y-4">
                <p className="text-[11px] text-white/60 leading-relaxed font-sans text-left">
                  Simulate a potential stock transaction to test aggregate weight shifts, sector rotation drifts, and health score changes prior to committing real market funds.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Symbol with suggestions */}
                  <div className="relative text-left">
                    <label className="text-[9px] uppercase tracking-wider text-white/40 font-mono font-bold block mb-1">Company symbol</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TCS"
                      value={simSymbol}
                      onChange={(e) => setSimSymbol(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500/50 uppercase"
                    />
                    {simSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-50 mt-1 bg-[#0d0f14]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        {simSuggestions.map(s => (
                          <button
                            key={s.symbol}
                            onClick={() => {
                              setSimSymbol(s.symbol);
                              setSimSuggestions([]);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-[10.5px] flex justify-between items-center font-mono cursor-pointer text-white/80"
                          >
                            <span className="font-bold text-violet-400">{s.symbol}</span>
                            <span className="text-white/40 truncate text-[9px] max-w-[120px] font-sans">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Investment Amount */}
                  <div className="text-left">
                    <label className="text-[9px] uppercase tracking-wider text-white/40 font-mono font-bold block mb-1">Investment sum (₹)</label>
                    <input 
                      type="number" 
                      placeholder="₹25,000"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={!simSymbol || !simAmount}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent text-white font-bold text-xs py-2.5 rounded-xl uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.25)]"
                >
                  <Sparkles className="w-4 h-4 text-violet-300 animate-spin" style={{ animationDuration: "3s" }} />
                  <span>Run Simulation</span>
                </button>

                {/* Simulation outputs */}
                {simResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 space-y-4 text-left font-mono text-[11px]"
                  >
                    <div className="grid grid-cols-2 gap-3.5 text-center">
                      <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                        <span className="text-white/30 text-[8.5px] block uppercase">New Health Rating</span>
                        <span className="text-violet-400 font-bold text-sm block mt-0.5">{simResult.newHealthScore}/100</span>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                        <span className="text-white/30 text-[8.5px] block uppercase">New Sector Weight</span>
                        <span className="text-white font-bold text-sm block mt-0.5">{simResult.newSectorWeight.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-black/20 border border-white/5 rounded-xl text-white/70 font-sans text-xs leading-relaxed">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-left font-sans text-[11.5px]" dangerouslySetInnerHTML={{ __html: simResult.commentary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
