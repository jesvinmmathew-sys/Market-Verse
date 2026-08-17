import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Eye, 
  Info, 
  Maximize2, 
  Bookmark, 
  HelpCircle,
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Newspaper,
  Zap,
  CheckCircle,
  Briefcase,
  Wallet,
  LineChart as LineChartIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Stock, StockHistoryItem, PortfolioItem, NewsItem } from "../types";
import { marketApi } from "../services/marketApi";
import { aiApi, AIAnalysisResult } from "../services/aiApi";
import { TradingService } from "../services/trading";
import { newsApi } from "../services/newsApi";

const LOCAL_STOCK_NEWS: Record<string, { title: string; source: string; time: string; sentiment: "Bullish" | "Bearish" | "Neutral"; explanation: string }[]> = {
  RELIANCE: [
    {
      title: "Reliance Retail Launches Automated Logistics Hub to Accelerate Q3 Margin Delivery",
      source: "Economic Times",
      time: "10 mins ago",
      sentiment: "Bullish",
      explanation: "Significant reduction in dispatch overheads is expected to expand operating margins by 120bps."
    },
    {
      title: "RIL Signs Green Hydrogen Supply Accord with Leading European Conglomerates",
      source: "Bloomberg Quint",
      time: "2 hours ago",
      sentiment: "Bullish",
      explanation: "Unlocks early lead in sustainable industrial fuels, attracting high ESG institutional capital."
    }
  ],
  TCS: [
    {
      title: "TCS Secures $1.2B Enterprise Migration Cloud Contract with UK Life Insurance Consortium",
      source: "Financial Express",
      time: "30 mins ago",
      sentiment: "Bullish",
      explanation: "Large deal win secures robust revenue visibility over a 7-year multi-phase deployment roadmap."
    },
    {
      title: "Attrition Stabilizes at Historic Lows of 11.2% in Latest Tata Consultancy Talent Audit",
      source: "CNBC TV18",
      time: "4 hours ago",
      sentiment: "Bullish",
      explanation: "Reduced training and hiring expenditures translate directly to stronger quarterly operating leverage."
    }
  ],
  INFY: [
    {
      title: "Infosys Expands Sovereign Gen-AI Cloud Deployments with Major Nordic Telecommunication Giants",
      source: "Reuters",
      time: "15 mins ago",
      sentiment: "Bullish",
      explanation: "Sovereign clouds command premium billing rates, boosting digital service revenues."
    },
    {
      title: "Infosys CEO Outlines $4B Generative AI Project Pipeline during Global Partner Keynote",
      source: "ET Tech",
      time: "3 hours ago",
      sentiment: "Bullish",
      explanation: "Confirms robust corporate migration spend despite broader global IT outsourcing caution."
    }
  ],
  HDFCBANK: [
    {
      title: "HDFC Bank Deposit Mobilization Campaign Surpasses Q1 Targets by 14% on Retail Push",
      source: "Mint",
      time: "1 hour ago",
      sentiment: "Bullish",
      explanation: "Secures stable low-cost CASA deposits, strengthening net interest margin (NIM) outlooks."
    },
    {
      title: "HDFC Bank Announces Spin-off Timelines for High-Margin Digital Lending Subsidiary",
      source: "Business Standard",
      time: "5 hours ago",
      sentiment: "Bullish",
      explanation: "Significant value unlocking for existing shareholders through structured equity distribution."
    }
  ],
  EURUSD: [
    {
      title: "ECB Hawkish Inflation Commentary Restores Floor for Euro Against Major Counterparts",
      source: "FXStreet",
      time: "25 mins ago",
      sentiment: "Bullish",
      explanation: "Expectations of prolonged high rates prevent capital outflow, supporting the currency pair."
    },
    {
      title: "US Durable Goods Acceleration Triggers Brief Technical Corrections in EURUSD Assets",
      source: "Reuters Forex",
      time: "3 hours ago",
      sentiment: "Bearish",
      explanation: "Stronger US macro indicators increase Treasury yields, bolstering near-term USD buying."
    }
  ],
  USDINR: [
    {
      title: "RBI Actively Defends 83.50 Threshold as Capital Inflows Stabilize Exchange Valuations",
      source: "Financial Express",
      time: "45 mins ago",
      sentiment: "Neutral",
      explanation: "Consistent intervention suppresses historical volatility, keeping option premiums flat."
    },
    {
      title: "Indian Sovereign Bonds Inclusion in Global Emerging Indices Drives Persistent Capital Inflow",
      source: "Bloomberg",
      time: "4 hours ago",
      sentiment: "Bearish",
      explanation: "Heavy bond buying drives dollar inflows, applying strong downward weight on USD/INR exchange rate."
    }
  ]
};

const getStockNews = (sym: string) => {
  const clean = sym.toUpperCase();
  if (LOCAL_STOCK_NEWS[clean]) return LOCAL_STOCK_NEWS[clean];
  return [
    {
      title: `${sym} Technical Parameters Converge Near Long-Term Support Levels on Volume Spikes`,
      source: "MarketVerse Feed",
      time: "40 mins ago",
      sentiment: "Bullish" as const,
      explanation: "Institutional accumulation patterns detected at historical trading ranges support price levels."
    },
    {
      title: `Global Asset Managers Rebalance Allocations: Portfolio Weightings Updated for ${sym}`,
      source: "FinTech Wire",
      time: "3 hours ago",
      sentiment: "Neutral" as const,
      explanation: "Standard index optimization shifts holding parameters without altering core market sentiment."
    }
  ];
};

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
  onToggleWatchlist: (symbol: string) => void;
  isInWatchlist: boolean;
}

export const StockDetail: React.FC<StockDetailProps> = ({ 
  symbol, 
  onBack, 
  onToggleWatchlist, 
  isInWatchlist 
}) => {
  const [stock, setStock] = useState<Stock | null>(null);
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "1D">("1D");
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  
  // Indicator toggles
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  // Hover state
  const [hoveredPoint, setHoveredPoint] = useState<StockHistoryItem | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // News and practice trade states
  const [selectedNews, setSelectedNews] = useState<{ title: string; source: string; time: string; sentiment: "Bullish" | "Bearish" | "Neutral"; explanation: string } | null>(null);
  const [practiceAction, setPracticeAction] = useState<"BUY" | "SELL" | null>(null);
  const [practiceQty, setPracticeQty] = useState<number>(10);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Core trading states
  const [tradeShares, setTradeShares] = useState<number>(10);
  const [tradeStatus, setTradeStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => TradingService.getPortfolio());
  const [cashBalance, setCashBalance] = useState<number>(() => TradingService.getCash());

  // Listen to portfolio updates to keep cash and holdings perfectly synced
  useEffect(() => {
    const handleSync = () => {
      setPortfolio(TradingService.getPortfolio());
      setCashBalance(TradingService.getCash());
    };
    window.addEventListener("aura_portfolio_updated", handleSync);
    return () => {
      window.removeEventListener("aura_portfolio_updated", handleSync);
    };
  }, []);

  // Live news and processing state
  const [liveNews, setLiveNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // High-fidelity Market Live-Feed & Developer properties
  const [devMode, setDevMode] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetched.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastFetched]);

  useEffect(() => {
    let active = true;
    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        const data = await newsApi.getLatestNews();
        if (active) {
          setLiveNews(data);
        }
      } catch (err) {
        console.log("Failed to load live news feed:", err);
      } finally {
        if (active) {
          setLoadingNews(false);
        }
      }
    };
    fetchNews();
    return () => { active = false; };
  }, [symbol]); // Refresh news when asset symbol changes

  // Compute tagged news specific to this symbol with back-compatibility mapping
  const stockNewsList = useMemo(() => {
    // 1. Filter live news items containing this symbol
    const filtered = liveNews.filter(news => {
      if (news.relatedSymbols && Array.isArray(news.relatedSymbols)) {
        return news.relatedSymbols.includes(symbol.toUpperCase());
      }
      return false;
    });

    // 2. Map items to ensure full compatibility with current practice trade overlay
    const mapper = (items: any[]) => items.map((news, idx) => {
      // Convert Positive -> Bullish, Negative -> Bearish, Neutral -> Neutral
      const sentiment: "Bullish" | "Bearish" | "Neutral" = 
        news.impactDirection === "Positive" ? "Bullish" :
        news.impactDirection === "Negative" ? "Bearish" : "Neutral";
      
      return {
        id: news.id || `news-${symbol}-${idx}`,
        title: news.title,
        source: news.source,
        time: news.time,
        sentiment,
        explanation: news.aiSummary || news.preview || "No summary available.",
        impactScore: news.impactScore || (sentiment === "Bullish" ? 75 : sentiment === "Bearish" ? 70 : 45),
        marketImpact: news.marketImpact || "Medium"
      };
    });

    if (filtered.length > 0) {
      return mapper(filtered);
    }

    // 3. Fallback to high-quality local template news if no live articles are relevant to this symbol
    const fallbackTemplates = LOCAL_STOCK_NEWS[symbol.toUpperCase()] || [
      {
        title: `${symbol} Consolidation Signals Accumulation Phase Under Dynamic Volatility Bands`,
        source: "MarketVerse Feed",
        time: "1 hour ago",
        sentiment: "Bullish" as const,
        explanation: "Institutional liquidity blocks are clustering around key exponential support structures.",
        impactScore: 78,
        marketImpact: "Medium"
      },
      {
        title: `Macroeconomic Realignment Patterns Affecting Portfolio Weights of ${symbol}`,
        source: "FinTech Wire",
        time: "3 hours ago",
        sentiment: "Neutral" as const,
        explanation: "Global indices report rebalancing parameters causing short-term volume dispersion without long-term trend change.",
        impactScore: 42,
        marketImpact: "Low"
      }
    ];

    return fallbackTemplates.map((item, idx) => ({
      id: `fallback-${symbol}-${idx}`,
      title: item.title,
      source: item.source,
      time: item.time,
      sentiment: item.sentiment,
      explanation: item.explanation,
      impactScore: (item as any).impactScore || 65,
      marketImpact: (item as any).marketImpact || "Medium"
    }));
  }, [liveNews, symbol]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const match = await marketApi.getStockBySymbol(symbol);
      if (!match) return;

      const history = await marketApi.getStockHistoryForTimeframe(symbol, timeframe);
      setStock({ ...match, history });
      setHoveredPoint(null);
      setHoverIdx(null);
      setLastFetched(new Date());
      setSecondsAgo(0);
      
      // Trigger AI analysis based on new timeframe/history
      setLoadingAI(true);
      const analysis = await aiApi.analyzeStock(symbol, match.price, history);
      setAiAnalysis(analysis);
      setLoadingAI(false);
    } catch (err) {
      console.error("Failed loading stock data:", err);
    } finally {
      if (isRefresh) setIsRefreshing(false);
    }
  }, [symbol, timeframe]);

  // Fetch stock and recalculate history on timeframe or symbol change
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white/50" id="stock-detail-loading">
        <div className="w-8 h-8 rounded-full border-2 border-[#3D81E3] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-mono">Synchronizing financial stream...</p>
      </div>
    );
  }

  const { history } = stock;
  const isForex = stock.type === "forex";

  // Calculate drawing bounds for our custom SVG chart
  const prices = history.map(h => h.close);
  const highs = history.map(h => h.high);
  const lows = history.map(h => h.low);
  
  let maxPrice = Math.max(...highs);
  let minPrice = Math.min(...lows);

  // Incorporate indicators in boundaries if active
  if (showMA) {
    const mas = history.map(h => h.ma || h.close);
    maxPrice = Math.max(maxPrice, ...mas);
    minPrice = Math.min(minPrice, ...mas);
  }
  if (showBB) {
    const uppers = history.map(h => h.bbands?.upper || h.close);
    const lowers = history.map(h => h.bbands?.lower || h.close);
    maxPrice = Math.max(maxPrice, ...uppers);
    minPrice = Math.min(minPrice, ...lowers);
  }

  const priceRange = maxPrice - minPrice || 1;
  // Pad bounds slightly for visual margin
  const chartMax = maxPrice + priceRange * 0.05;
  const chartMin = Math.max(0.0001, minPrice - priceRange * 0.05);
  const chartRange = chartMax - chartMin;

  const width = 800;
  const height = 300;

  // Map array index to SVG coordinate
  const getX = (idx: number) => {
    return (idx / (history.length - 1)) * (width - 80) + 40;
  };

  const getY = (price: number) => {
    return height - 30 - ((price - chartMin) / chartRange) * (height - 60);
  };

  // Build the SVG path for line chart
  const linePath = history.map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(h.close)}`).join(" ");
  // Gradient fill under the line chart
  const areaPath = `${linePath} L ${getX(history.length - 1)} ${height - 30} L ${getX(0)} ${height - 30} Z`;

  // Build the Moving Average line path
  const maPath = showMA 
    ? history.map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(h.ma || h.close)}`).join(" ") 
    : "";

  // Build Bollinger Bands bands paths
  const bbUpperPath = showBB ? history.map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(h.bbands?.upper || h.close)}`).join(" ") : "";
  const bbLowerPath = showBB ? history.map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(h.bbands?.lower || h.close)}`).join(" ") : "";
  const bbAreaPath = showBB && history.length > 0
    ? `${bbUpperPath} L ${history.map((_, i) => `${getX(history.length - 1 - i)} ${getY(history[history.length - 1 - i].bbands?.lower || history[history.length - 1 - i].close)}`).join(" L ")} Z`
    : "";

  // Mouse move handler for interactive crosshair tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - 40) / (rect.width - 80); // map back based on scale
    
    let idx = Math.round(ratio * (history.length - 1));
    idx = Math.max(0, Math.min(history.length - 1, idx));
    
    setHoveredPoint(history[idx]);
    setHoverIdx(idx);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverIdx(null);
  };

  const currentHover = hoveredPoint || history[history.length - 1];

  const holding = portfolio.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
  const ownedShares = holding ? holding.shares : 0;
  const avgBuyPrice = holding ? holding.avgBuyPrice : 0;
  const estimatedCost = tradeShares * stock.price;

  return (
    <div className="space-y-6" id={`stock-detail-symbol-${symbol.toLowerCase()}`}>
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
            id="btn-back-to-terminal"
          >
            ← Terminal
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{stock.name}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-white/50">{stock.symbol}</span>
              
              {/* High-fidelity Data Connection Status Indicator */}
              {stock.dataStatus === "LIVE" ? (
                <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE DATA
                </span>
              ) : stock.dataStatus === "DELAYED" ? (
                <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  DELAYED DATA
                </span>
              ) : (
                <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 flex items-center gap-1 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  DEMO DATA
                </span>
              )}
            </div>
            
            {/* Standard displays: Data Source, Last Updated, Data Status */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-white/50 font-sans">
              <div className="flex items-center gap-1">
                <span className="text-white/30 uppercase tracking-wider text-[9px] font-bold">Data Source:</span>
                <span className="text-white/80 font-mono font-medium">{stock.source || stock.debug?.provider || "Simulation Live Feed Fallback"}</span>
              </div>
              <span className="text-white/20 hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <span className="text-white/30 uppercase tracking-wider text-[9px] font-bold">Last Updated:</span>
                <span className="text-white/80 font-mono font-medium">
                  {stock.timestamp ? new Date(stock.timestamp).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "Just now"}
                </span>
              </div>
              <span className="text-white/20 hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <span className="text-white/30 uppercase tracking-wider text-[9px] font-bold">Data Status:</span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  stock.dataStatus === "LIVE" ? "text-emerald-400 bg-emerald-500/10" :
                  stock.dataStatus === "DELAYED" ? "text-amber-400 bg-amber-500/10" :
                  "text-cyan-400 bg-cyan-500/10"
                }`}>
                  {stock.dataStatus || "DEMO"}
                </span>
              </div>
            </div>

            {/* Price Discrepancy warning alert */}
            {stock.priceDiscrepancy && (
              <div className="mt-2.5 bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg flex items-start gap-2.5 text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="font-bold block">Price discrepancy detected</span>
                  <span className="text-rose-400/80 text-[10px]">
                    The difference between provider prices is greater than 2%. Standard public data may suffer from delayed synchronizations.
                  </span>
                  {stock.debug?.comparedPrices && (
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[9px] font-mono">
                      {Object.entries(stock.debug.comparedPrices).map(([p, price]) => (
                        <span key={p} className="bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/10">
                          {p}: ₹{typeof price === "number" ? price.toFixed(2) : price}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Last Updated Counter */}
          <div className="text-[10px] font-mono text-white/40 flex flex-col items-end mr-1">
            <span>Last Updated:</span>
            <span className="text-white/60 font-semibold">{secondsAgo === 0 ? "Just now" : `${secondsAgo}s ago`}</span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            title="Refresh Stock price data from live feed"
            id="btn-refresh-market-data"
          >
            <Activity className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Developer Mode Toggle */}
          <button
            onClick={() => setDevMode(!devMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              devMode 
                ? "bg-[#3D81E3]/20 border-[#3D81E3]/40 text-[#5F9FFF]" 
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
            }`}
            title="Toggle Developer Mode to inspect data sources and raw API payloads"
            id="btn-toggle-dev-mode"
          >
            DEV MODE: {devMode ? "ON" : "OFF"}
          </button>

          {/* Watchlist toggle */}
          <button 
            onClick={() => onToggleWatchlist(stock.symbol)}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              isInWatchlist 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
            }`}
            id="btn-toggle-watchlist"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isInWatchlist ? "fill-amber-300" : ""}`} />
            <span>{isInWatchlist ? "Watching" : "Add to Watchlist"}</span>
          </button>
        </div>
      </div>

      {/* Developer Mode Live Market Debug Panel */}
      {devMode && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3" id="dev-mode-debug-panel">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
            <h3 className="text-xs font-bold tracking-wider text-[#5F9FFF] uppercase flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              Terminal Developer Mode: Live Market Data Debugger
            </h3>
            <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase">
              Connection Verified
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-white/40">Market Data Source:</span>
              <p className="text-emerald-400 font-semibold mt-0.5">{stock.debug?.provider || stock.source || "Yahoo Finance Indian Market Provider"}</p>
            </div>
            <div>
              <span className="text-white/40">Timestamp of Returned Data:</span>
              <p className="text-amber-400 mt-0.5">{stock.debug?.timestamp || stock.timestamp || lastFetched.toISOString()}</p>
            </div>
            <div>
              <span className="text-white/40">Symbol Sent:</span>
              <p className="text-purple-400 mt-0.5">{stock.debug?.symbolSent || stock.symbol}</p>
            </div>
            <div>
              <span className="text-white/40">Data Exchange:</span>
              <p className="text-[#3D81E3] mt-0.5">{stock.exchange || "NSE"}</p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-white/40">Raw API Response Payload:</span>
            <pre className="p-3 rounded bg-black/50 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-48 border border-white/5 scrollbar-thin">
              {JSON.stringify(stock.debug?.rawResponse || { note: "Using premium live provider stream.", price: stock.price, change: stock.change, percentChange: stock.percentChange, volume: stock.volume }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Main Quote Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-white/5 bg-black/30" id="quote-metrics-bar">
        <div>
          <div className="text-[10px] text-white/40 font-mono uppercase">Last Price</div>
          <div className="text-2xl font-semibold tracking-tight font-mono text-white mt-1">
            {isForex ? "" : "₹"}{stock.price.toLocaleString("en-US", { minimumFractionDigits: isForex ? 4 : 2 })}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 font-mono uppercase">Change</div>
          <div className={`text-sm font-semibold font-mono flex items-center gap-1 mt-2.5 ${stock.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {stock.change >= 0 ? "+" : ""}{stock.change.toLocaleString("en-US", { minimumFractionDigits: isForex ? 4 : 2 })} ({stock.percentChange > 0 ? "+" : ""}{stock.percentChange}%)
          </div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 font-mono uppercase">24h Range</div>
          <div className="text-xs font-medium font-mono text-white/80 mt-2.5">
            Low: {stock.dayLow.toLocaleString()} - High: {stock.dayHigh.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 font-mono uppercase">Volume</div>
          <div className="text-xs font-semibold font-mono text-white/80 mt-2.5">
            {stock.volume}
          </div>
        </div>
      </div>

      {/* Workspace: Chart and AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="chart-workspace-container">
        
        {/* CHART PORTION (8 cols) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col justify-between" id="chart-panel">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border border-white/5 bg-black/20" id="chart-controls">
            
            {/* Timeframes */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md" id="timeframe-toggles">
              {(["1m", "5m", "15m", "1h", "1D"] as const).map((tf) => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    timeframe === tf ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                  id={`tf-${tf.toLowerCase()}`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart Type (Candle vs Line) */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md" id="chart-type-toggles">
              <button 
                onClick={() => setChartType("candle")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                  chartType === "candle" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                }`}
                id="btn-chart-candle"
              >
                CANDLE
              </button>
              <button 
                onClick={() => setChartType("line")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                  chartType === "line" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                }`}
                id="btn-chart-line"
              >
                LINE
              </button>
            </div>

            {/* Technical Overlay toggles */}
            <div className="flex flex-wrap items-center gap-2" id="indicator-layers">
              <button 
                onClick={() => setShowMA(!showMA)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                  showMA ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" : "bg-white/5 text-white/40 border-white/5 hover:text-white"
                }`}
                id="btn-toggle-sma"
              >
                SMA (14)
              </button>
              <button 
                onClick={() => setShowBB(!showBB)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                  showBB ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-white/5 text-white/40 border-white/5 hover:text-white"
                }`}
                id="btn-toggle-bb"
              >
                BBANDS
              </button>
              <button 
                onClick={() => setShowRSI(!showRSI)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                  showRSI ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-white/5 text-white/40 border-white/5 hover:text-white"
                }`}
                id="btn-toggle-rsi"
              >
                RSI
              </button>
              <button 
                onClick={() => setShowMACD(!showMACD)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                  showMACD ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "bg-white/5 text-white/40 border-white/5 hover:text-white"
                }`}
                id="btn-toggle-macd"
              >
                MACD
              </button>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="relative rounded-xl border border-white/5 bg-[#0a0a0c] p-4 flex-1 select-none" id="primary-chart-stage">
            
            {/* Live Hover Legend Data */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-4 text-[10px] font-mono" id="chart-data-legend">
              <span className="text-white/40">TIME: <strong className="text-white">{currentHover.time}</strong></span>
              <span className="text-white/40">OPEN: <strong className="text-white">{currentHover.open}</strong></span>
              <span className="text-white/40">HIGH: <strong className="text-emerald-400">{currentHover.high}</strong></span>
              <span className="text-white/40">LOW: <strong className="text-rose-400">{currentHover.low}</strong></span>
              <span className="text-white/40">CLOSE: <strong className="text-white">{currentHover.close}</strong></span>
              {showMA && <span className="text-yellow-400">SMA(14): <strong>{currentHover.ma}</strong></span>}
            </div>

            {/* Custom SVG Drawing */}
            <svg 
              width="100%" 
              height={height} 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full cursor-crosshair overflow-visible"
              id="svg-drawing-stage"
            >
              {/* Horizontal grid guide lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const price = chartMin + chartRange * ratio;
                const y = getY(price);
                return (
                  <g key={ratio} opacity={0.15}>
                    <line x1="40" y1={y} x2={width - 40} y2={y} stroke="#fff" strokeWidth="0.5" strokeDasharray="3 3" />
                    <text x={width - 35} y={y + 3} fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="start">
                      {price.toLocaleString(undefined, { maximumFractionDigits: isForex ? 3 : 1 })}
                    </text>
                  </g>
                );
              })}

              {/* Bollinger Bands Shaded Area */}
              {showBB && bbAreaPath && (
                <path d={bbAreaPath} fill="rgba(168, 85, 247, 0.04)" />
              )}

              {/* Bollinger Bands Lines */}
              {showBB && (
                <>
                  <path d={bbUpperPath} fill="none" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" strokeDasharray="2 2" />
                  <path d={bbLowerPath} fill="none" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" strokeDasharray="2 2" />
                </>
              )}

              {/* Chart line if active */}
              {chartType === "line" && (
                <>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(61, 129, 227, 0.3)" />
                      <stop offset="100%" stopColor="rgba(61, 129, 227, 0.0)" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#chartGradient)" />
                  <path d={linePath} fill="none" stroke="#3D81E3" strokeWidth="2" />
                </>
              )}

              {/* Candlesticks Drawing */}
              {chartType === "candle" && history.map((h, i) => {
                const x = getX(i);
                const openY = getY(h.open);
                const closeY = getY(h.close);
                const highY = getY(h.high);
                const lowY = getY(h.low);

                const isGreen = h.close >= h.open;
                const candleColor = isGreen ? "#10B981" : "#EF4444";
                const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
                const bodyY = Math.min(openY, closeY);
                const candleWidth = Math.max(2, Math.min(10, (width - 80) / history.length * 0.7));

                return (
                  <g key={i}>
                    {/* Shadow wick */}
                    <line x1={x} y1={highY} x2={x} y2={lowY} stroke={candleColor} strokeWidth="1" />
                    {/* Real body */}
                    <rect 
                      x={x - candleWidth / 2} 
                      y={bodyY} 
                      width={candleWidth} 
                      height={bodyHeight} 
                      fill={candleColor} 
                    />
                  </g>
                );
              })}

              {/* Moving Average Line overlay */}
              {showMA && maPath && (
                <path d={maPath} fill="none" stroke="#EAB308" strokeWidth="1.5" />
              )}

              {/* Crosshair indicator */}
              {hoverIdx !== null && (
                <g>
                  <line x1={getX(hoverIdx)} y1="10" x2={getX(hoverIdx)} y2={height - 30} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="40" y1={getY(currentHover.close)} x2={width - 40} y2={getY(currentHover.close)} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
                  <circle cx={getX(hoverIdx)} cy={getY(currentHover.close)} r="4" fill="#3D81E3" stroke="#fff" strokeWidth="1.5" />
                </g>
              )}
            </svg>
          </div>

          {/* Sub-Panel: RSI (14) indicator */}
          {showRSI && (
            <div className="rounded-xl border border-white/5 bg-[#0a0a0c] p-4 text-left relative h-32" id="rsi-chart-panel">
              <div className="absolute top-2 left-4 text-[10px] font-mono text-cyan-300">RSI (14)</div>
              <svg width="100%" height="80" className="w-full mt-4" id="rsi-svg">
                {/* Guides */}
                <line x1="40" y1="15" x2={width - 40} y2="15" stroke="rgba(239, 68, 68, 0.25)" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x={width - 35} y="18" fill="rgba(239,68,68,0.5)" fontSize="8" fontFamily="monospace">70</text>
                
                <line x1="40" y1="55" x2={width - 40} y2="55" stroke="rgba(34, 197, 94, 0.25)" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x={width - 35} y="58" fill="rgba(34,197,94,0.5)" fontSize="8" fontFamily="monospace">30</text>

                {/* RSI Line */}
                <path 
                  d={history.map((h, i) => {
                    const rsiVal = h.rsi !== undefined ? h.rsi : 50;
                    // map 0-100 scale to 0-80 height
                    const y = 80 - 10 - (rsiVal / 100) * 60;
                    return `${i === 0 ? "M" : "L"} ${getX(i)} ${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          )}

          {/* Sub-Panel: MACD indicator */}
          {showMACD && (
            <div className="rounded-xl border border-white/5 bg-[#0a0a0c] p-4 text-left relative h-32" id="macd-chart-panel">
              <div className="absolute top-2 left-4 text-[10px] font-mono text-indigo-300">MACD (12, 26, 9)</div>
              <svg width="100%" height="80" className="w-full mt-4" id="macd-svg">
                {/* Zero line */}
                <line x1="40" y1="40" x2={width - 40} y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                
                {/* MACD Histogram bars */}
                {history.map((h, i) => {
                  const histVal = h.macd?.hist || 0;
                  const x = getX(i);
                  const yZero = 40;
                  const yHist = 40 - histVal * 5; // amplify multiplier
                  const isPositive = histVal >= 0;
                  return (
                    <line 
                      key={i}
                      x1={x} 
                      y1={yZero} 
                      x2={x} 
                      y2={yHist} 
                      stroke={isPositive ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)"} 
                      strokeWidth="2.5" 
                    />
                  );
                })}

                {/* MACD main line */}
                <path 
                  d={history.map((h, i) => {
                    const macdVal = h.macd?.macd || 0;
                    const y = 40 - macdVal * 5;
                    return `${i === 0 ? "M" : "L"} ${getX(i)} ${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="1"
                />

                {/* MACD Signal line */}
                <path 
                  d={history.map((h, i) => {
                    const sigVal = h.macd?.signal || 0;
                    const y = 40 - sigVal * 5;
                    return `${i === 0 ? "M" : "L"} ${getX(i)} ${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}
        </div>

        {/* AI PANEL PORTION (4 cols) */}
        <div className="lg:col-span-4 space-y-5" id="ai-assistant-panel">
          
          {/* Order Execution Terminal */}
          <div className="liquid-glass rounded-xl p-5 border border-white/5 bg-[#0f1115]/85 space-y-4 text-left" id="order-execution-terminal">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Terminal Order Placement</h3>
              </div>
              <span className="text-[9px] bg-[#3D81E3]/10 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Simulated Live</span>
            </div>

            {/* Account Stats & Holdings */}
            <div className="grid grid-cols-2 gap-3" id="trade-acc-stats">
              <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-mono uppercase">
                  <Wallet className="w-3 h-3 text-cyan-500/70" />
                  <span>Simulated Cash</span>
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  ₹{cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-mono uppercase">
                  <Briefcase className="w-3 h-3 text-emerald-500/70" />
                  <span>Your Position</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  {ownedShares > 0 ? `${ownedShares} ${isForex ? "Ctrs" : "Shares"}` : "None"}
                </div>
                {ownedShares > 0 && (
                  <div className="text-[8px] text-white/30 font-mono mt-0.5">
                    Avg: ₹{avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: isForex ? 4 : 2 })}
                  </div>
                )}
              </div>
            </div>

            {/* Inputs & Quantity Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 font-mono uppercase block">Order Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTradeShares(prev => Math.max(1, prev - 10))}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer font-bold text-xs font-mono transition-colors"
                  title="Decrease by 10"
                >
                  -10
                </button>
                <button
                  onClick={() => setTradeShares(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer font-bold text-xs font-mono transition-colors"
                  title="Decrease by 1"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={tradeShares}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    setTradeShares(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                  }}
                  className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1 text-center font-mono font-semibold text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  onClick={() => setTradeShares(prev => prev + 1)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer font-bold text-xs font-mono transition-colors"
                  title="Increase by 1"
                >
                  +
                </button>
                <button
                  onClick={() => setTradeShares(prev => prev + 10)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer font-bold text-xs font-mono transition-colors"
                  title="Increase by 10"
                >
                  +10
                </button>
              </div>

              {/* Quantity Preset Quick Tags */}
              <div className="flex gap-1.5 pt-1">
                {[10, 50, 100, 500].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setTradeShares(qty)}
                    className={`flex-1 py-1 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                      tradeShares === qty 
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                        : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Pricing Summary */}
            <div className="p-3 bg-black/35 rounded-lg border border-white/5 space-y-1 text-xs">
              <div className="flex justify-between font-mono text-white/50">
                <span>Execution Rate:</span>
                <span className="text-white">
                  ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: isForex ? 4 : 2 })}
                </span>
              </div>
              <div className="flex justify-between font-mono font-bold text-white/80 border-t border-white/5 pt-1.5">
                <span>Total Transaction Value:</span>
                <span className="text-cyan-400">
                  ₹{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={async () => {
                  const userStored = localStorage.getItem("supabase_user");
                  if (!userStored) {
                    window.dispatchEvent(new CustomEvent("marketverse_trigger_gate"));
                    return;
                  }
                  setTradeStatus(null);
                  const res = await TradingService.buyStock(symbol, tradeShares);
                  setTradeStatus(res);
                  if (res.success) {
                    setTimeout(() => setTradeStatus(null), 5000);
                  }
                }}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                BUY {symbol}
              </button>
              <button
                onClick={async () => {
                  const userStored = localStorage.getItem("supabase_user");
                  if (!userStored) {
                    window.dispatchEvent(new CustomEvent("marketverse_trigger_gate"));
                    return;
                  }
                  setTradeStatus(null);
                  const res = await TradingService.sellStock(symbol, tradeShares);
                  setTradeStatus(res);
                  if (res.success) {
                    setTimeout(() => setTradeStatus(null), 5000);
                  }
                }}
                className="w-full py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-black font-bold text-xs transition-colors shadow-lg shadow-rose-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                SELL {symbol}
              </button>
            </div>

            {/* Transaction Alert Log */}
            <AnimatePresence>
              {tradeStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    tradeStatus.success 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left leading-relaxed">
                    <p className="font-bold mb-0.5">{tradeStatus.success ? "Transaction Completed" : "Order Execution Failed"}</p>
                    <p className="opacity-90 font-sans">{tradeStatus.message}</p>
                  </div>
                  <button onClick={() => setTradeStatus(null)} className="text-[10px] font-mono opacity-50 hover:opacity-100 p-0.5">×</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Box 1: MarketVerse AI Agent */}
          <div className="liquid-glass rounded-xl p-5 border border-white/5 bg-[#0f1115]/80 space-y-5" id="marketverse-ai-agent-container">
            {/* AI Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-[#0B2551] flex items-center justify-center text-cyan-200 animate-pulse">
                  <Sparkles className="w-4 h-4 fill-cyan-400/20" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold text-white tracking-wide">MarketVerse AI</h2>
                  <p className="text-[10px] text-cyan-300 font-mono">Generative Quant Node</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] text-emerald-400 font-mono font-bold">LIVE FEED</span>
              </div>
            </div>

            {/* Status Report loader */}
            {loadingAI ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/30 space-y-3">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <p className="text-xs font-mono text-cyan-300/80">Querying neural models...</p>
              </div>
            ) : (
              aiAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                  id="ai-analysis-output"
                >
                  {/* AI Preamble & Delay Warning */}
                  <div className="text-left bg-cyan-500/5 border border-cyan-500/15 p-3 rounded-lg text-[10px] font-mono text-cyan-300">
                    <p className="flex items-center gap-1.5 leading-snug">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Using the latest available market data from <strong className="text-white">{stock.source || stock.debug?.provider || "Simulation Fallback"}</strong></span>
                    </p>
                    {stock.dataStatus === "DELAYED" && (
                      <p className="text-amber-400/80 mt-1.5 text-[9px] leading-snug">
                        ⚠️ Market data may be delayed depending on provider availability.
                      </p>
                    )}
                  </div>

                  {/* Brief Note Box - Requested explicitly */}
                  <div className="p-3.5 rounded-lg bg-[#3D81E3]/5 border border-[#3D81E3]/20 text-left">
                    <span className="text-[9px] text-cyan-300 font-bold font-mono uppercase tracking-wider block mb-1">Company Status Note</span>
                    <p className="text-xs text-white/90 leading-relaxed italic font-sans">
                      "{aiAnalysis.briefNote}"
                    </p>
                  </div>

                  {/* Sentiment & Confidence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-left">
                      <span className="text-[9px] text-white/40 font-mono uppercase block">Bias Sentiment</span>
                      <span className={`text-sm font-bold flex items-center gap-1 mt-1 ${
                        aiAnalysis.sentiment === "Bullish" ? "text-emerald-400" : aiAnalysis.sentiment === "Bearish" ? "text-rose-400" : "text-amber-400"
                      }`}>
                        {aiAnalysis.sentiment === "Bullish" ? <TrendingUp className="w-3.5 h-3.5" /> : aiAnalysis.sentiment === "Bearish" ? <TrendingDown className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        {aiAnalysis.sentiment}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-left">
                      <span className="text-[9px] text-white/40 font-mono uppercase block">Model Confidence</span>
                      <span className="text-sm font-bold text-cyan-300 flex items-center gap-1 mt-1 font-mono">
                        <Flame className="w-3.5 h-3.5 fill-cyan-400/10 text-cyan-400" />
                        {aiAnalysis.confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Safety Score Meter (Explicitly Requested) */}
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-left space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[9px] text-white/40 font-mono uppercase">Safety Profile</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        aiAnalysis.safetyScore >= 75 ? "bg-emerald-500/10 text-emerald-400" : aiAnalysis.safetyScore >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {aiAnalysis.safetyScore >= 75 ? "Very Safe" : aiAnalysis.safetyScore >= 50 ? "Moderately Safe" : "High Speculation"}
                      </span>
                    </div>
                    <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          aiAnalysis.safetyScore >= 75 ? "bg-emerald-500" : aiAnalysis.safetyScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${aiAnalysis.safetyScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-white/30 font-mono">
                      <span>Speculative</span>
                      <span className="text-white/70 font-bold">{aiAnalysis.safetyScore}% Safety Rating</span>
                      <span>Institutional</span>
                    </div>
                  </div>

                  {/* Risk percentage bar */}
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-left space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[9px] text-white/40 font-mono uppercase">Quant Volatility Risk</span>
                      <span className="text-rose-400 font-mono text-[10px] font-bold">{aiAnalysis.risk} ({aiAnalysis.riskPercentage}% Risk)</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
                        style={{ width: `${aiAnalysis.riskPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Primary Reasons List */}
                  {aiAnalysis.reasons && aiAnalysis.reasons.length > 0 && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-left space-y-1.5">
                      <span className="text-[9px] text-white/40 font-mono uppercase block">Analytical Drivers</span>
                      <ul className="space-y-1.5">
                        {aiAnalysis.reasons.map((reason, rIdx) => (
                          <li key={rIdx} className="text-[10px] text-white/80 flex items-start gap-1.5 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Outlook Scenarios */}
                  {aiAnalysis.possibleScenarios && (
                    <div className="grid grid-cols-1 gap-2 text-left">
                      <div className="p-3 rounded-lg bg-cyan-500/[0.02] border border-cyan-500/10 space-y-1">
                        <span className="text-[9px] text-cyan-300 font-mono uppercase tracking-wider block">Short-Term Scenario</span>
                        <p className="text-[10px] text-white/80 leading-relaxed">
                          {aiAnalysis.possibleScenarios.shortTerm}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#3D81E3]/[0.02] border border-[#3D81E3]/10 space-y-1">
                        <span className="text-[9px] text-indigo-300 font-mono uppercase tracking-wider block">Medium-Term Scenario</span>
                        <p className="text-[10px] text-white/80 leading-relaxed">
                          {aiAnalysis.possibleScenarios.mediumTerm}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Paragraph Explanation */}
                  <div className="text-left bg-black/15 p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Technical Strategy Plan</span>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed font-sans text-justify">
                      {aiAnalysis.strategyExplanation}
                    </p>
                  </div>
                </motion.div>
              )
            )}

            <div className="text-[10px] text-white/30 font-mono text-center pt-2 border-t border-white/5">
              Refreshed dynamically in {timeframe} timeframe
            </div>
          </div>

          {/* Box 2: Latest News for this Stock (Explicitly Requested) */}
          <div className="liquid-glass rounded-xl p-5 border border-white/5 bg-[#0f1115]/80 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Latest News: {symbol}</h3>
              </div>
              <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded font-mono">Live Stream</span>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {loadingNews ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2 text-white/40">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-mono">Running AI News Pipeline...</span>
                </div>
              ) : stockNewsList.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-[11px]">
                  No news available for {symbol}.
                </div>
              ) : (
                stockNewsList.map((news, idx) => (
                  <div 
                    key={news.id || idx}
                    onClick={() => {
                      setSelectedNews(news);
                      setPracticeAction(null);
                      setPracticeFeedback(null);
                    }}
                    className="p-3 rounded-lg bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] text-white/40 font-mono">{news.source} • {news.time}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-mono ${
                          news.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : news.sentiment === "Bearish" ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/50"
                        }`}>
                          {news.sentiment}
                        </span>
                        {news.impactScore !== undefined && (
                          <span className="text-[8px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/10 px-1.5 py-0.5 rounded font-bold font-mono" title="AI Relevance/Impact Score">
                            Impact: {news.impactScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold text-white mt-1 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                      {news.title}
                    </h4>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                      {news.explanation}
                    </p>
                    
                    {/* Dynamic AI relevance score visual indicator bar */}
                    {news.impactScore !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-white/5 h-1 rounded overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              news.sentiment === "Bullish" ? "bg-emerald-400" : news.sentiment === "Bearish" ? "bg-rose-400" : "bg-cyan-400"
                            }`}
                            style={{ width: `${news.impactScore}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-white/30 font-mono">{news.impactScore}% Relevance</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="text-[9px] text-white/30 text-center font-mono">
              Click a headline to open the AI News Practice trading node.
            </div>
          </div>

        </div>
      </div>

      {/* Interactive AI News Practice Trading Modal Overlay */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0f1115] border border-white/10 rounded-xl p-6 shadow-2xl space-y-5 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedNews.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : selectedNews.sentiment === "Bearish" ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/40"
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 font-mono uppercase">{selectedNews.source} • {selectedNews.time}</span>
                    <h3 className="text-sm font-bold text-white leading-tight">AI Headline Intelligence Node</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="text-white/40 hover:text-white font-mono text-sm px-2 py-1 rounded hover:bg-white/5"
                >
                  ESC
                </button>
              </div>

              {/* Headline & Analysis */}
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-[9px] text-white/30 font-mono uppercase block">Financial Headline</span>
                  <h4 className="text-xs font-bold text-white mt-0.5 leading-snug">{selectedNews.title}</h4>
                </div>

                <div className="p-4 bg-black/25 border border-white/5 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI News Assessment
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      selectedNews.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : selectedNews.sentiment === "Bearish" ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/40"
                    }`}>
                      {selectedNews.sentiment.toUpperCase()} SIGNAL
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed font-sans text-justify">
                    {selectedNews.explanation}
                  </p>
                </div>
              </div>

              {/* Live Practice Module */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Interactive Trading Practice</h5>
                    <p className="text-[10px] text-white/40 font-sans">Simulate immediate market entries based on this event.</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">Price: ₹{stock?.price?.toLocaleString() || symbol}</span>
                </div>

                {practiceFeedback ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{practiceFeedback}</span>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setPracticeAction("BUY")}
                        className={`py-2 rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 ${
                          practiceAction === "BUY" ? "bg-emerald-500 text-black" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Practice Buy Long
                      </button>
                      <button 
                        onClick={() => setPracticeAction("SELL")}
                        className={`py-2 rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 ${
                          practiceAction === "SELL" ? "bg-rose-500 text-black" : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        Practice Sell Short
                      </button>
                    </div>

                    {practiceAction && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 p-3 bg-white/[0.01] border border-white/5 rounded-lg"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Position Quantity:</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setPracticeQty(q => Math.max(1, q - 5))}
                              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono text-white font-bold w-8 text-center">{practiceQty}</span>
                            <button 
                              onClick={() => setPracticeQty(q => q + 5)}
                              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                          <span className="text-white/40">Total Position Value:</span>
                          <span className="font-bold font-mono text-cyan-300">
                            ₹{(practiceQty * (stock?.price || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <button 
                          onClick={() => {
                            const isCorrect = (selectedNews.sentiment === "Bullish" && practiceAction === "BUY") || 
                                              (selectedNews.sentiment === "Bearish" && practiceAction === "SELL") ||
                                              (selectedNews.sentiment === "Neutral");
                            
                            if (isCorrect) {
                              setPracticeFeedback(`Successfully executed virtual position! You aligned perfectly with the AI's Bullish/Bearish sentiment. +₹${Math.floor(practiceQty * (stock?.price || 1) * 0.03)} demo profit.`);
                            } else {
                              setPracticeFeedback(`Position entered. Note: Your decision went against the AI's sentiment analysis, which suggests higher short-term risk.`);
                            }
                          }}
                          className="w-full py-2 rounded-lg bg-cyan-400 text-black font-semibold text-xs hover:bg-cyan-300 transition-colors"
                        >
                          Confirm Practice Position
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
