import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Clock, 
  Activity, 
  Compass, 
  BookOpen, 
  Newspaper, 
  Layout, 
  Plus, 
  X, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Check, 
  Eye,
  Sliders,
  BarChart2,
  Lock,
  Bookmark,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Stock, NewsItem, Lesson, PortfolioItem, WatchlistItem } from "../types";
import { marketApi, getOrCreateDynamicStock } from "../services/marketApi";
import { INDIAN_STOCK_UNIVERSE } from "../services/indianStocksDb";
import { newsApi } from "../services/newsApi";
import { TradingService } from "../services/trading";
import { GlowingBullModel, GlowingBearModel } from "./VisualAssets";

interface NewsTemplate {
  title: string;
  source: string;
  category: "Breaking" | "Company" | "Global" | "Economy";
  marketImpact: "High" | "Medium" | "Low";
  impactDirection: "Positive" | "Negative" | "Neutral";
  preview: string;
  aiSummary: string;
}

const NEWS_TEMPLATES: NewsTemplate[] = [
  {
    title: "Reliance Industries and NVIDIA Collaborate on Supercomputing and AI Infrastructure",
    source: "Economic Times",
    category: "Company",
    marketImpact: "High",
    impactDirection: "Positive",
    preview: "The partnership will focus on building AI computing infrastructure, cloud services, and custom models for Indian enterprise applications. The stock rose slightly in grey market trades.",
    aiSummary: "Very Bullish for RELIANCE. Partnership with the global AI hardware leader positions Reliance as the core infrastructure layer of India's impending artificial intelligence boom."
  },
  {
    title: "Global Brent Crude Spikes to $84.20 on Middle East Shipping Bottlenecks",
    source: "Bloomberg",
    category: "Global",
    marketImpact: "Medium",
    impactDirection: "Negative",
    preview: "Crude futures spiked over 1.8% as logistics firms report further detours around critical naval chokepoints. Energy analysts warn of localized fuel inflation if disruptions extend.",
    aiSummary: "Bearish sentiment for oil importing nations, specifically Indian indices (NIFTY/SENSEX), as a rise in crude prices exerts trade deficit and fiscal pressure on corporate input costs."
  },
  {
    title: "TCS Secures Multi-Million Dollar AI Transformation Deal with British Retail Consortium",
    source: "CNBC",
    category: "Company",
    marketImpact: "High",
    impactDirection: "Positive",
    preview: "The project involves integrating generative AI search, inventory optimization, and automated customer experience systems across over 100 retailers in the United Kingdom.",
    aiSummary: "Highly positive for TCS. Validates its capabilities to secure next-generation enterprise AI modernization contracts, signaling a robust IT budget revival."
  },
  {
    title: "USD/INR Touches New All-Time High as FPI Outflows Continue to Mount",
    source: "Reuters",
    category: "Economy",
    marketImpact: "Medium",
    impactDirection: "Negative",
    preview: "The Indian Rupee weakened towards historic lows against the dollar on sustained capital outflows. RBI was reportedly spotted intervening through state-run banks to limit volatility.",
    aiSummary: "Bearish for Indian equities in the short term, but extremely positive for IT and pharmaceutical exporters whose dollar-denominated revenues appreciate in local currency terms."
  },
  {
    title: "Adani Enterprises Announces ₹15,000 Crore Qualified Institutional Placement (QIP) for Clean Energy",
    source: "LiveMint",
    category: "Company",
    marketImpact: "High",
    impactDirection: "Positive",
    preview: "The conglomerate plans to deploy proceeds to fast-track its solar manufacturing gigafactory in Gujarat and expand green hydrogen distribution lines across the western corridor.",
    aiSummary: "Bullish momentum for ADANIENT. Capital infusion removes debt-overhang fears and establishes clear funding visibility for its capital-intensive green energy assets."
  },
  {
    title: "US Federal Reserve Minutes Hint at Flexible Interest Rate Strategy in Coming Quarter",
    source: "Wall Street Journal",
    category: "Global",
    marketImpact: "High",
    impactDirection: "Positive",
    preview: "The meeting transcripts suggest officials are increasingly satisfied with the inflation trajectory, opening up possibilities of an unexpected rate trim if employment softens.",
    aiSummary: "Extremely Bullish for global markets. Softening rate trajectories drive liquidity into high-yield emerging markets, benefiting Indian equities and stabilized Forex pairs."
  },
  {
    title: "Eurozone GDP Beats Forecasts by 0.2%, Spurring Relief Across European Desks",
    source: "Financial Times",
    category: "Global",
    marketImpact: "Medium",
    impactDirection: "Positive",
    preview: "The flash Eurostat estimates showed strong service-sector expansion in Germany and France, helping the broader bloc sidestep immediate recessionary pressure.",
    aiSummary: "Positive for EUR/USD. Helps support the Euro above 1.0850 against the greenback as economic fundamentals stabilize ahead of the upcoming ECB policy meeting."
  },
  {
    title: "NIFTY 50 Heavyweights Lead Breakout Past 24,200 Level in Technical Rally",
    source: "MoneyControl",
    category: "Breaking",
    marketImpact: "High",
    impactDirection: "Positive",
    preview: "A sudden wave of short-covering and massive buying in banking and conglomerates launched the benchmark index to fresh multi-day highs, defying global consolidation trends.",
    aiSummary: "Bullish technical confirmation. Breakout past the 24,200 resistance level indicates strong bullish continuation patterns, likely setting the stage for 24,500 target zones."
  },
  {
    title: "Infosys Expands Enterprise Generative AI Partnership with Microsoft Azure Cloud",
    source: "TechCrunch",
    category: "Company",
    marketImpact: "High",
    impactDirection: "Positive",
    preview: "The expanded alliance will deliver custom industry solutions combining Azure OpenAI services with Infosys Topaz AI tooling. Joint sales pipelines will prioritize European healthcare clients.",
    aiSummary: "Positive for INFY. Deepens its cloud alliances and positions the firm to offer enterprise clients a pre-validated, compliant pipeline of AI models and deployment scripts."
  },
  {
    title: "Indian Private Capex Shows Double Digit Growth Led by Steel and Auto sectors",
    source: "Business Standard",
    category: "Economy",
    marketImpact: "Medium",
    impactDirection: "Positive",
    preview: "Corporate credit deployment shows healthy growth as private entities announce fresh capacity installations in anticipation of strong domestic demand.",
    aiSummary: "Highly positive for metal and banking sectors. Demonstrates strong business confidence and sustainable long-term economic expansion."
  }
];

function formatTimeAgo(createdAt?: number, fallbackString: string = "Live Feed"): string {
  if (!createdAt) return fallbackString;
  const diffSec = Math.floor((Date.now() - createdAt) / 1000);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return fallbackString;
}

interface MarketTerminalProps {
  currentRoute: string;
  onNavigate: (path: string) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  user?: any;
}

const LESSONS: Lesson[] = [
  {
    id: "learn-1",
    title: "Stock market basics",
    category: "Beginner",
    description: "Learn how the order book, market makers, and stock exchanges function.",
    time: "10 min read",
    level: "Lv. 1",
    strategy: "Order Flow Arbitrage",
    sections: [
      { title: "What is a Stock?", content: "A stock represents ownership in a corporation. When you purchase a share, you are purchasing a fractional piece of the company's assets and future earnings." },
      { title: "Exchanges & Order Books", content: "Exchanges like the National Stock Exchange (NSE) match buyers and sellers. The order book displays the live list of buy bids and sell asks. The spread is the difference between the highest bid and lowest ask." },
      { title: "Key Metrics to Watch", content: "Learn to track Market Cap (overall value), Volume (liquidity indicator), and the P/E Ratio (valuation relative to earnings)." }
    ]
  },
  {
    id: "learn-2",
    title: "Investing fundamentals",
    category: "Beginner",
    description: "The secret to wealth compounding through dollar cost averaging and passive tracking.",
    time: "12 min read",
    level: "Lv. 1",
    strategy: "Dollar Cost Averaging (DCA)",
    sections: [
      { title: "The Power of Compounding", content: "Einstein famously called compound interest the eighth wonder of the world. Reinvesting dividends and returns creates exponential portfolio growth curves." },
      { title: "Dollar Cost Averaging (DCA)", content: "DCA involves investing a fixed sum regularly, regardless of asset prices. This mitigates volatility risk by purchasing more shares when prices are low and fewer when high." },
      { title: "Diversification Rule", content: "Never put all your eggs in one basket. Spread risk across sectors (Technology, Banking, Autos) and asset classes (Equities, Forex, Commodities)." }
    ]
  },
  {
    id: "learn-3",
    title: "Risk management",
    category: "Beginner",
    description: "The absolute law of trading: Protect capital at all costs.",
    time: "15 min read",
    level: "Lv. 2",
    strategy: "Position Sizing Matrix",
    sections: [
      { title: "Stop Loss Placement", content: "A stop loss is an automated order to sell a security when it reaches a specific price. Never enter a trade without defining your pain threshold." },
      { title: "The 2% Rule", content: "Never risk more than 2% of your total trading equity on any single transaction. If your portfolio is ₹1,00,000, your maximum stop-loss loss should not exceed ₹2,000." },
      { title: "Risk-to-Reward Ratio", content: "Aim for a minimum ratio of 1:2. If you risk ₹10 per share, your target profit should be at least ₹20 per share." }
    ]
  },
  {
    id: "learn-4",
    title: "Candlestick analysis",
    category: "Intermediate",
    description: "Decode high-frequency human emotions by reading candlestick structures.",
    time: "18 min read",
    level: "Lv. 3",
    strategy: "Reversal Candle Confirmation",
    sections: [
      { title: "Anatomy of a Candle", content: "Candlesticks display the Open, High, Low, and Close prices for a specific period. The thick body represents open-to-close, while the wicks (shadows) map extremes." },
      { title: "Bullish Hammers & Dojis", content: "A Hammer candlestick forms when sellers push prices down during the period, only for a strong buyers' wave to drive it back up. It indicates a powerful trend reversal." },
      { title: "Morning Star Pattern", content: "A three-candle bullish pattern showing transition from a strong down-wave (red) to consolidation (doji) to strong up-trend breakout (green)." }
    ]
  },
  {
    id: "learn-5",
    title: "Support and resistance",
    category: "Intermediate",
    description: "Draw key pivot zones where institutional supply and demand forces collide.",
    time: "15 min read",
    level: "Lv. 3",
    strategy: "Breakout Pullback Entry",
    sections: [
      { title: "What is Support?", content: "Support is the price zone where buying force is strong enough to overcome selling pressure, halting a decline and pivoting the price upward." },
      { title: "What is Resistance?", content: "Resistance is the price level where selling supply is abundant, stopping an upward climb and forcing price downward." },
      { title: "Role Reversal Principle", content: "Once a resistance zone is broken on strong volume, it flips and becomes a new support floor on subsequent pullbacks." }
    ]
  },
  {
    id: "learn-6",
    title: "Trend identification",
    category: "Intermediate",
    description: "Align your trading with the path of least resistance: The trend is your friend.",
    time: "20 min read",
    level: "Lv. 4",
    strategy: "EMA Golden Crossover",
    sections: [
      { title: "Market Structures", content: "An uptrend is characterized by a sequential series of Higher Highs (HH) and Higher Lows (HL). A downtrend features Lower Highs (LH) and Lower Lows (LL)." },
      { title: "Moving Average Filters", content: "Use the 50-period and 200-period Exponential Moving Averages (EMAs). When the price sits above the EMAs, focus exclusively on buying setups." },
      { title: "The Golden Cross", content: "A Golden Cross occurs when the 50-day EMA crosses above the 200-day EMA. This signals a major long-term structural bull run." }
    ]
  },
  {
    id: "learn-7",
    title: "Portfolio building",
    category: "Advanced",
    description: "Construct modern risk-adjusted portfolios using math-driven weighting.",
    time: "22 min read",
    level: "Lv. 5",
    strategy: "Beta-Weighted Sector Rotation",
    sections: [
      { title: "Modern Portfolio Theory (MPT)", content: "MPT proves that an investor can construct a diversified portfolio to maximize returns for a given level of risk by selecting non-correlated assets." },
      { title: "Understanding Beta (β)", content: "Beta measures a stock's volatility relative to the benchmark index. Low-beta defensive stocks (ITC, utilities) protect capital during market downturns, while high-beta sectors (Tata Motors, tech) accelerate gains in bull waves." },
      { title: "Rebalancing Matrix", content: "Quarterly rebalancing keeps asset allocations in sync with risk tolerances, forcing you to sell overvalued peaks and buy undervalued dips." }
    ]
  },
  {
    id: "learn-8",
    title: "Quant strategies",
    category: "Advanced",
    description: "Unleash programmatic statistical advantages in modern high-frequency markets.",
    time: "25 min read",
    level: "Lv. 6",
    strategy: "Mean Reversion Arbitrage",
    sections: [
      { title: "Statistical Arbitrage", content: "Stat-Arb uses algorithmic models to identify historical price spreads between correlated stock pairs. When spreads diverge to extremes, the algorithm buys the laggard and shorts the leader." },
      { title: "Mean Reversion trading", content: "Mean reversion is the mathematical assumption that asset prices eventually return to their historical average. Utilize Bollinger Bands and Z-Scores to trigger buy/sell bounds." },
      { title: "Backtesting Hazards", content: "Beware of overfitting. Fitting algorithms too perfectly to past data creates models that fail in live, high-entropy market conditions." }
    ]
  },
  {
    id: "learn-9",
    title: "Forex trading mechanics",
    category: "Intermediate",
    description: "Master global currency dynamics, leverage calculations, and interest rate differentials.",
    time: "15 min read",
    level: "Lv. 3",
    strategy: "Interest Rate Carry Trade",
    sections: [
      { title: "Currency Pairs & Pips", content: "Forex is always traded in pairs (e.g., EUR/USD). The first currency is the base, and the second is the quote. A pip represents the fourth decimal place, measuring the smallest unit of change." },
      { title: "The Carry Trade Strategy", content: "A carry trade involves borrowing a currency from a country with low interest rates (like JPY) and investing in a currency with high interest rates (like INR or USD) to pocket the yield spread." },
      { title: "Leverage and Risk Control", content: "Because currency movements are small, leverage is heavily used. However, small volatility can wipe out capital. Tight stop-losses on major pairs like EUR/USD are mandatory." }
    ]
  },
  {
    id: "learn-10",
    title: "Bollinger Bands volatility",
    category: "Intermediate",
    description: "Map market extremes using dynamic statistical standard deviation channels.",
    time: "18 min read",
    level: "Lv. 4",
    strategy: "Band Squeeze Breakout",
    sections: [
      { title: "Anatomy of the Bands", content: "Created by John Bollinger, the indicator consists of a middle band (simple moving average) and an upper and lower band set at two standard deviations away from the middle." },
      { title: "The Volatility Squeeze", content: "When the bands contract tightly together, it indicates low volatility. Since low volatility is always followed by high volatility, a breakout is imminent." },
      { title: "Double-Top Band Reversals", content: "If price surges outside the upper band, pulls back, and then makes a second peak that fails to touch the upper band, a bearish trend reversal is highly probable." }
    ]
  },
  {
    id: "learn-11",
    title: "Options spread matrices",
    category: "Advanced",
    description: "Construct structural risk-defined profiles using multi-leg Options spreads.",
    time: "24 min read",
    level: "Lv. 5",
    strategy: "Delta-Neutral Iron Condor",
    sections: [
      { title: "Options vs Equities", content: "Options are derivative contracts giving the buyer the right, but not obligation, to trade a stock. Options have theta (time decay), which option sellers exploit." },
      { title: "The Iron Condor setup", content: "By simultaneously selling an out-of-the-money put and call, and buying further out-of-the-money options to cap risk, you create a market-neutral yield machine." },
      { title: "Managing Theta Decay", content: "As time progresses, option contracts lose value exponentially. The Iron Condor profits from this daily erosion as long as the asset stays range-bound." }
    ]
  },
  {
    id: "learn-12",
    title: "AI market forecasting",
    category: "Advanced",
    description: "Harness neural network layers and natural language models to extract structural alpha.",
    time: "30 min read",
    level: "Lv. 6",
    strategy: "Sentiment-Weighted LSTM",
    sections: [
      { title: "Predicting with LSTMs", content: "Long Short-Term Memory networks are a specialized recurrent neural network architecture suited to processing and predicting time-series sequences." },
      { title: "Alternative Data Streams", content: "Modern quant funds scrape news headlines, central bank minutes, and social media text to generate a continuous numerical sentiment index." },
      { title: "Synthesizing News and Price", content: "By combining NLP sentiment vector parameters with high-frequency price inputs, AI models forecast next-day probability vectors rather than precise single price points." }
    ]
  }
];

export const MarketTerminal: React.FC<MarketTerminalProps> = ({ 
  currentRoute, 
  onNavigate,
  watchlist,
  onToggleWatchlist,
  user
}) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<"All" | "Breaking" | "Company" | "Global" | "Economy">("All");
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockSectorFilter, setStockSectorFilter] = useState("All");
  const [stockCapFilter, setStockCapFilter] = useState("All");
  const [stockMovementFilter, setStockMovementFilter] = useState("All");
  const [customTickerError, setCustomTickerError] = useState("");
  const [addingCustomTicker, setAddingCustomTicker] = useState(false);
  const [analyzingNewsId, setAnalyzingNewsId] = useState<string | null>(null);
  const [newsAnalysisData, setNewsAnalysisData] = useState<Record<string, {
    sentiment: string;
    impact: string;
    confidence: number;
    explanation: string;
  }>>({});
  
  // Immersive lesson modal state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Simulated live portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => TradingService.getPortfolio());

  // Buying/Selling simulated popup
  const [tradeStock, setTradeStock] = useState<Stock | null>(null);
  const [tradeShares, setTradeShares] = useState<number>(10);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [userBalance, setUserBalance] = useState<number>(() => TradingService.getCash()); // INR starter cash

  // Dashboard customizable widget toggles
  const [showPortfolioWidget, setShowPortfolioWidget] = useState(true);
  const [showWatchlistWidget, setShowWatchlistWidget] = useState(true);
  const [showHeatmapWidget, setShowHeatmapWidget] = useState(true);
  const [showStatsWidget, setShowStatsWidget] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState<"bullish" | "bearish" | null>(null);

  // Dynamic AI Market Summary State
  const [aiMarketSummary, setAiMarketSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  useEffect(() => {
    async function loadSummary() {
      setLoadingSummary(true);
      try {
        const response = await fetch("/api/ai/summary");
        if (response.ok) {
          const data = await response.json();
          if (data && data.summaryText) {
            setAiMarketSummary(data.summaryText);
          }
        }
      } catch (err) {
        console.error("Failed to load AI summary:", err);
      } finally {
        setLoadingSummary(false);
      }
    }
    loadSummary();
  }, []);

  // Tick the live prices and real-time news feed
  useEffect(() => {
    async function initData() {
      const all = await marketApi.getAllStocks();
      setStocks(all);
      const latestNews = await newsApi.getLatestNews();
      const augmentedNews = latestNews.map((n, idx) => ({
        ...n,
        createdAt: Date.now() - (idx * 180000 + Math.floor(Math.random() * 45000))
      }));
      setNews(augmentedNews);
    }
    initData();

    const priceInterval = setInterval(() => {
      const updated = marketApi.tickMarketPrices();
      setStocks(updated);

      // Dynamically update portfolio current prices
      const updatedPortfolio = TradingService.updatePortfolioPrices(updated);
      setPortfolio(updatedPortfolio);
    }, 2000);

    // Dynamic time formatting tick every second
    const timeInterval = setInterval(() => {
      setNews(prev => prev.map(item => {
        if (item.createdAt) {
          return {
            ...item,
            time: formatTimeAgo(item.createdAt, item.time)
          };
        }
        return item;
      }));
    }, 1000);

    // Inject dynamic breaking AI news alerts every 15 seconds
    const newsInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * NEWS_TEMPLATES.length);
      const template = NEWS_TEMPLATES[randomIndex];
      
      const newArticle: NewsItem = {
        id: `news-live-${Date.now()}`,
        title: template.title,
        source: template.source,
        category: template.category,
        marketImpact: template.marketImpact,
        impactDirection: template.impactDirection,
        preview: template.preview,
        aiSummary: template.aiSummary,
        createdAt: Date.now(),
        time: "Just now"
      };

      setNews(prev => {
        const filtered = prev.filter(p => p.title !== newArticle.title);
        return [newArticle, ...filtered].slice(0, 15);
      });
    }, 15000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(timeInterval);
      clearInterval(newsInterval);
    };
  }, []);

  // Dynamically load stocks from the complete Indian Stock Universe matching the search query
  useEffect(() => {
    const query = stockSearchQuery.trim().toUpperCase();
    if (query.length >= 2) {
      // 1. Instant local search on top 300+ stocks
      const localMatches = INDIAN_STOCK_UNIVERSE.filter(item => 
        item.symbol.toUpperCase().includes(query) || 
        item.name.toUpperCase().includes(query)
      );

      let changed = false;
      localMatches.forEach(item => {
        const exists = stocks.some(s => s.symbol.toUpperCase() === item.symbol.toUpperCase());
        if (!exists) {
          getOrCreateDynamicStock(item.symbol);
          changed = true;
        }
      });

      if (changed) {
        marketApi.getAllStocks().then(all => {
          setStocks(all);
        });
      }

      // 2. Scalable dynamic backend registry search (thousands of companies)
      const fetchDelay = setTimeout(async () => {
        try {
          const res = await fetch(`/api/market/search?query=${encodeURIComponent(query)}`);
          if (res.ok) {
            const serverMatches = await res.json();
            if (Array.isArray(serverMatches)) {
              let serverChanged = false;
              serverMatches.forEach(item => {
                const exists = stocks.some(s => s.symbol.toUpperCase() === item.symbol.toUpperCase());
                if (!exists) {
                  getOrCreateDynamicStock(item.symbol, item);
                  serverChanged = true;
                }
              });

              if (serverChanged) {
                const all = await marketApi.getAllStocks();
                setStocks(all);
              }
            }
          }
        } catch (err) {
          console.error("Scalable stock registry search failed:", err);
        }
      }, 300); // Debounce to prevent server hammering

      return () => clearTimeout(fetchDelay);
    }
  }, [stockSearchQuery]);

  // Listen to portfolio updates from anywhere in the app to keep state synchronized
  useEffect(() => {
    const handleSync = () => {
      setPortfolio(TradingService.getPortfolio());
      setUserBalance(TradingService.getCash());
    };
    window.addEventListener("aura_portfolio_updated", handleSync);
    return () => {
      window.removeEventListener("aura_portfolio_updated", handleSync);
    };
  }, []);

  // Filter stocks by route
  const isStocksRoute = currentRoute === "/stocks";
  const isNewsRoute = currentRoute === "/news";
  const isLearnRoute = currentRoute === "/learn";
  const isDashboardRoute = currentRoute === "/dashboard" || currentRoute === "/";

  // Helper to parse market cap category
  function getCapCategory(capStr?: string): "Large" | "Mid" | "Small" {
    if (!capStr) return "Small";
    const num = parseFloat(capStr);
    if (capStr.includes("T")) {
      if (num >= 2.0) return "Large";
      if (num >= 0.5) return "Mid";
      return "Small";
    }
    if (capStr.includes("B")) {
      if (num >= 500) return "Mid";
      return "Small";
    }
    return "Small";
  }

  const displayedStocks = stocks.filter(s => {
    // If not stocks page, show nothing
    if (!isStocksRoute) return false;

    // Search query matches symbol, name, or sector
    const query = stockSearchQuery.toLowerCase().trim();
    if (query) {
      const matchSymbol = s.symbol.toLowerCase().includes(query);
      const matchName = s.name.toLowerCase().includes(query);
      const matchSector = s.sector && s.sector.toLowerCase().includes(query);
      if (!matchSymbol && !matchName && !matchSector) return false;
    }

    // Sector Filter
    if (stockSectorFilter !== "All") {
      if (!s.sector || s.sector.toLowerCase() !== stockSectorFilter.toLowerCase()) return false;
    }

    // Market Cap Filter
    if (stockCapFilter !== "All") {
      const capCategory = getCapCategory(s.marketCap);
      if (capCategory !== stockCapFilter) return false;
    }

    // Price Movement Filter
    if (stockMovementFilter !== "All") {
      if (stockMovementFilter === "Gainers" && s.percentChange < 0) return false;
      if (stockMovementFilter === "Losers" && s.percentChange >= 0) return false;
    }

    return true;
  });

  const displayedNews = news.filter(n => {
    if (activeNewsCategory === "All") return true;
    return n.category === activeNewsCategory;
  });

  // Calculate top gainers/losers
  const sortedByPerf = [...stocks].filter(s => s.symbol !== "NIFTY50" && s.symbol !== "SENSEX" && s.symbol !== "BANKNIFTY").sort((a, b) => b.percentChange - a.percentChange);
  const topGainers = sortedByPerf.slice(0, 4);
  const topLosers = sortedByPerf.slice(-4).reverse();

  // Calculate top 5 bullish and bearish stocks
  const equitiesOnly = stocks.filter(s => s.symbol !== "NIFTY50" && s.symbol !== "SENSEX" && s.symbol !== "BANKNIFTY" && s.type === "india");

  const topBullish = equitiesOnly.map(s => {
    const history = s.history || [];
    const lastItem = history.length > 0 ? history[history.length - 1] : null;
    const rsi = lastItem?.rsi !== undefined ? lastItem.rsi : 50;
    const macdHist = lastItem?.macd?.hist !== undefined ? lastItem.macd.hist : 0;
    const ma = lastItem?.ma !== undefined ? lastItem.ma : s.price;
    const aboveMA = s.price > ma;

    let score = 50;
    const chgFactor = s.percentChange > 0 ? Math.min(30, s.percentChange * 12) : 0;
    score += chgFactor;
    if (rsi >= 50) score += Math.min(25, (rsi - 50) * 1.25);
    else if (rsi < 30) score += 10;
    if (macdHist > 0) score += 15;
    if (aboveMA) score += 15;
    score = Math.floor(Math.min(98, Math.max(45, score)));
    return { stock: s, score };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  const topBearish = equitiesOnly.map(s => {
    const history = s.history || [];
    const lastItem = history.length > 0 ? history[history.length - 1] : null;
    const rsi = lastItem?.rsi !== undefined ? lastItem.rsi : 50;
    const macdHist = lastItem?.macd?.hist !== undefined ? lastItem.macd.hist : 0;
    const ma = lastItem?.ma !== undefined ? lastItem.ma : s.price;
    const aboveMA = s.price > ma;

    let score = 50;
    const chgFactor = s.percentChange < 0 ? Math.min(30, Math.abs(s.percentChange) * 12) : 0;
    score += chgFactor;
    if (rsi < 50) score += Math.min(25, (50 - rsi) * 1.25);
    if (macdHist < 0) score += 15;
    if (!aboveMA) score += 15;
    score = Math.floor(Math.min(98, Math.max(45, score)));
    return { stock: s, score };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  // Buy/Sell transaction execution
  const executeSimulatedTrade = async () => {
    if (!tradeStock) return;

    if (tradeType === "buy") {
      const res = await TradingService.buyStock(tradeStock.symbol, tradeShares);
      alert(res.message);
    } else {
      const res = await TradingService.sellStock(tradeStock.symbol, tradeShares);
      alert(res.message);
    }

    setTradeStock(null);
  };

  const portfolioValue = portfolio.reduce((acc, item) => acc + (item.shares * item.currentPrice), 0);
  const portfolioCost = portfolio.reduce((acc, item) => acc + (item.shares * item.avgBuyPrice), 0);
  const portfolioGain = portfolioValue - portfolioCost;
  const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0;

  return (
    <div className="relative min-h-screen bg-bg-app text-text-main flex flex-col justify-between selection:bg-brand/30" id="terminal-root">
      
      {/* Terminal Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-12 gap-6 items-start relative z-10" id="terminal-main-grid">
        
        {/* Left Guard: Bull/Bear Market Forces Panel */}
        <div className="col-span-12 lg:col-span-2 hidden lg:flex flex-col gap-6" id="market-forces-side-rail">
          {/* Bull Card */}
          <div 
            onClick={() => onNavigate("/market/bullish")}
            className="rounded-xl p-4 border text-center flex flex-col items-center cursor-pointer transition-all duration-200 select-none bg-white/[0.02] border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] glow-emerald"
          >
            <div className="text-[10px] font-mono text-white/40 uppercase mb-3">Market Strength</div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <TrendingUp size={20} />
            </div>
            <div className="text-[10px] font-bold text-emerald-400 mb-1.5 font-mono">BULL FORCE</div>
            <div className="text-[9px] text-white/50 font-mono leading-normal">Buyers defending critical moving averages.</div>
          </div>

          {/* Bear Card */}
          <div 
            onClick={() => onNavigate("/market/bearish")}
            className="rounded-xl p-4 border text-center flex flex-col items-center cursor-pointer transition-all duration-200 select-none bg-white/[0.02] border-white/5 hover:border-rose-500/40 hover:bg-rose-500/[0.02] hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] glow-crimson"
          >
            <div className="text-[10px] font-mono text-white/40 uppercase mb-3">Hedging Caution</div>
            <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400 mb-3 border border-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
              <TrendingDown size={20} />
            </div>
            <div className="text-[10px] font-bold text-rose-400 mb-1.5 font-mono">BEAR FORCE</div>
            <div className="text-[9px] text-white/50 font-mono leading-normal">Sellers watching macroeconomic resistance targets.</div>
          </div>
        </div>

        {/* Center/Right Dynamic View (10 cols) */}
        <div className="col-span-12 lg:col-span-10 space-y-6" id="terminal-content-view">
          

          {/* Weekend Market Closed Notice */}
          {(() => {
            const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
            if (!isWeekend) return null;
            return (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center justify-between gap-4 text-xs font-mono" id="weekend-closure-banner">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-amber-300">Weekend Overlays Active</span>
                    <p className="text-[11px] text-white/55 mt-0.5 font-sans leading-relaxed">
                      The NSE (Indian Markets) and global Forex desks are closed for the weekend (Saturday & Sunday). Real-time ticking and random price fluctuations are frozen at official Friday close levels. Live order book simulation will resume when markets reopen.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wide shrink-0">
                  MARKET CLOSED
                </span>
              </div>
            );
          })()}

          {/* DYNAMIC COMPONENT LOADER */}
          
          {/* ========================================================= */}
          {/* VIEW A: DASHBOARD */}
          {/* ========================================================= */}
          {isDashboardRoute && (
            <div className="space-y-6" id="terminal-view-dashboard">
              
              {/* Widgets Control/Customization Sliders */}
              <div className="liquid-glass rounded-xl p-4 border border-white/5 flex flex-wrap items-center justify-between gap-4" id="dashboard-widget-toggles">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <Sliders className="w-4 h-4 text-[#3D81E3]" />
                  <span>Customize Workspace Widgets:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { label: "Portfolio Hold", state: showPortfolioWidget, setter: setShowPortfolioWidget },
                    { label: "Watchlist Grid", state: showWatchlistWidget, setter: setShowWatchlistWidget },
                    { label: "Heatmap View", state: showHeatmapWidget, setter: setShowHeatmapWidget },
                    { label: "Leaderboards", state: showStatsWidget, setter: setShowStatsWidget }
                  ].map((ctrl) => (
                    <button 
                      key={ctrl.label}
                      onClick={() => ctrl.setter(!ctrl.state)}
                      className={`px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        ctrl.state ? "bg-[#3D81E3]/20 text-[#3D81E3] border-[#3D81E3]/40" : "bg-white/5 text-white/30 border-transparent hover:text-white"
                      }`}
                      id={`widget-toggle-${ctrl.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {ctrl.state ? "✓ " : "+ "} {ctrl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Row: AI summary block */}
              <div className="liquid-glass rounded-xl p-5 border border-white/5 bg-[#0B0F19]/60 flex items-start gap-4 text-left" id="dashboard-ai-summary-widget">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-[#0B2551] flex items-center justify-center text-cyan-200 shrink-0">
                  <Sparkles className="w-5 h-5 fill-cyan-400/20 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-widest">AI Daily Market intelligence</h3>
                    <span className="text-[8px] px-1.5 py-0.2 rounded border border-cyan-500/15 bg-cyan-500/5 text-cyan-400 font-mono tracking-widest uppercase">
                      AI Grounded
                    </span>
                  </div>
                  {loadingSummary ? (
                    <div className="flex items-center gap-2 py-1 text-white/30 font-mono text-[10px]">
                      <div className="w-3.5 h-3.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                      <span>Synthesizing structural sector inflows...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-white/85 leading-relaxed font-sans text-justify">
                      {aiMarketSummary || "Indian indices are holding consolidative support. Banking and Automobile indices show technical breakouts with Tata Motors leading. Monitor Bollinger Band widths for directional expansion cues. Educational analysis, not financial advice."}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Sentiment Stock Lists Section */}
              <AnimatePresence>
                {selectedSentiment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className={`liquid-glass rounded-xl border p-5 text-left mb-6 relative overflow-hidden ${
                      selectedSentiment === "bullish" 
                        ? "border-emerald-500/30 bg-emerald-500/[0.02]" 
                        : "border-rose-500/30 bg-rose-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          selectedSentiment === "bullish" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        }`}>
                          {selectedSentiment === "bullish" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {selectedSentiment === "bullish" ? "Active Bullish Forces Scanned" : "Active Bearish Forces Scanned"}
                          </h4>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">
                            {selectedSentiment === "bullish" ? "Top 5 Stocks Exhibiting High Momentum and Positive Inflows" : "Top 5 Stocks Exhibiting Structural Breakdowns and Downward Volatility"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedSentiment(null)}
                        className="text-white/40 hover:text-white text-xs font-mono border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        CLOSE RADAR
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      {(selectedSentiment === "bullish" ? topBullish : topBearish).map(({ stock, score }) => {
                        const isUp = stock.percentChange >= 0;
                        return (
                          <div 
                            key={stock.symbol}
                            onClick={() => onNavigate(`/stock/${stock.symbol.toLowerCase()}`)}
                            className="bg-[#0B0F19]/80 border border-white/5 rounded-xl p-3.5 hover:border-white/20 hover:bg-[#0B0F19] transition-all cursor-pointer flex flex-col justify-between h-32 text-left group"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">{stock.symbol}</span>
                                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                                  selectedSentiment === "bullish" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}>
                                  {score}%
                                </span>
                              </div>
                              <span className="text-[10px] text-white/40 truncate block mt-0.5">{stock.name}</span>
                              <span className="text-[9px] text-white/5 block font-mono mt-1">{stock.sector}</span>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/5 pt-2.5">
                              <span className="text-xs font-mono font-bold text-white">₹{stock.price.toFixed(1)}</span>
                              <span className={`text-[10px] font-bold font-mono ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                                {isUp ? "+" : ""}{stock.percentChange.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid 1: Customizable Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-widgets-grid">
                
                {/* Simulated Portfolio Tracker */}
                {showPortfolioWidget && (
                  <motion.div 
                    layout
                    className="liquid-glass rounded-xl p-5 border border-white/5 text-left flex flex-col justify-between space-y-4"
                    id="widget-portfolio-tracker"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h4 className="text-sm font-bold text-white tracking-wide">Live Simulated Portfolio</h4>
                        <span className={`text-xs font-bold font-mono ${portfolioGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {portfolioGain >= 0 ? "▲" : "▼"} {portfolioGain >= 0 ? "+" : ""}{portfolioGain.toLocaleString("en-US", { maximumFractionDigits: 2 })} ({portfolioGainPct.toFixed(2)}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-3" id="portfolio-header-metrics">
                        <div>
                          <span className="text-[9px] text-white/40 uppercase block font-mono">Current Valuation</span>
                          <span className="text-lg font-bold font-mono text-white">₹{portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-white/40 uppercase block font-mono">Investment Cost</span>
                          <span className="text-sm font-bold font-mono text-white/70">₹{portfolioCost.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-2" id="portfolio-items-list">
                        {portfolio.map((item) => {
                          const itemGain = (item.currentPrice - item.avgBuyPrice) * item.shares;
                          const isUp = itemGain >= 0;

                          // Match to full stock details for the trade modal
                          const matchedStock = stocks.find(s => s.symbol === item.symbol) || {
                            symbol: item.symbol,
                            name: item.name,
                            price: item.currentPrice,
                            change: 0,
                            percentChange: 0,
                            volume: "0",
                            marketCap: "0",
                            type: item.type,
                            dayHigh: item.currentPrice,
                            dayLow: item.currentPrice,
                            high52: item.currentPrice,
                            low52: item.currentPrice,
                            history: []
                          };

                          return (
                            <div key={item.symbol} className="flex flex-col p-2.5 rounded bg-white/[0.02] border border-white/5 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-white block">{item.symbol}</span>
                                  <span className="text-[10px] text-white/40 font-mono">{item.shares} shares @ Avg ₹{item.avgBuyPrice.toLocaleString()}</span>
                                </div>
                                <div className="text-right font-mono">
                                  <span className="font-semibold block text-white">₹{(item.shares * item.currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                  <span className={`text-[10px] ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isUp ? "+" : ""}{itemGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 pt-1.5 border-t border-white/5 justify-end">
                                <button
                                  onClick={() => {
                                    setTradeStock(matchedStock as Stock);
                                    setTradeType("buy");
                                    setTradeShares(10);
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 hover:border-emerald-500/40 cursor-pointer transition-all"
                                >
                                  BUY MORE
                                </button>
                                <button
                                  onClick={() => {
                                    setTradeStock(matchedStock as Stock);
                                    setTradeType("sell");
                                    setTradeShares(Math.min(item.shares, 10));
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 hover:border-rose-500/40 cursor-pointer transition-all"
                                >
                                  SELL SHARES
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Interactive Watchlist Grid */}
                {showWatchlistWidget && (
                  <motion.div 
                    layout
                    className="liquid-glass rounded-xl p-5 border border-white/5 text-left flex flex-col justify-between"
                    id="widget-watchlist-grid"
                  >
                    <div className="border-b border-white/5 pb-3 mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-wide">Live Active Watchlist</h4>
                      <span className="text-[10px] text-white/30 font-mono">{watchlist.length} items followed</span>
                    </div>

                    {watchlist.length === 0 ? (
                      <div className="py-12 text-center text-white/30 text-xs font-mono space-y-2" id="watchlist-empty-state">
                        <Bookmark className="w-5 h-5 mx-auto opacity-50" />
                        <p>No symbols followed yet. Visit Indian Markets or Forex tabs to add active symbols.</p>
                      </div>
                    ) : (
                      <div className="space-y-2" id="watchlist-items">
                        {stocks.filter(s => watchlist.includes(s.symbol)).map((w) => {
                          const isUp = w.percentChange >= 0;
                          return (
                            <motion.div 
                              key={w.symbol}
                              onClick={() => onNavigate(`/stock/${w.symbol.toLowerCase()}`)}
                              whileTap={{ scale: 0.98 }}
                              className="flex flex-col p-2.5 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer text-xs space-y-2 animate-none"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <span className="font-bold text-white block">{w.symbol}</span>
                                  <span className="text-[10px] text-white/40 truncate block max-w-[150px]">{w.name}</span>
                                </div>
                                <div className="text-right font-mono">
                                  <span className="font-semibold block">
                                    ₹{w.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className={`text-[10px] ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isUp ? "▲ +" : "▼ "}{w.percentChange}%
                                  </span>
                                </div>
                              </div>

                              {/* Watchlist Data Freshness & Discrepancy details */}
                              <div className="flex items-center justify-between text-[8px] font-mono text-white/30 border-t border-white/[0.03] pt-1.5 mt-0.5">
                                <span>Src: <strong className="text-white/50">{w.source || w.debug?.provider || "Simulation"}</strong></span>
                                <span className={`px-1 rounded font-bold ${
                                  w.dataStatus === "LIVE" ? "text-emerald-400 bg-emerald-500/10" :
                                  w.dataStatus === "DELAYED" ? "text-amber-400 bg-amber-500/10" :
                                  "text-cyan-400 bg-cyan-500/10"
                                }`}>{w.dataStatus || "DEMO"}</span>
                                <span>{w.timestamp ? new Date(w.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Just now"}</span>
                              </div>
                              {w.priceDiscrepancy && (
                                <div className="text-rose-400 text-[8px] font-bold bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20 text-left">
                                  ⚠️ Price discrepancy (&gt;2%)
                                </div>
                              )}
                              <div className="flex gap-1.5 pt-1.5 border-t border-white/5 justify-end" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setTradeStock(w);
                                    setTradeType("buy");
                                    setTradeShares(10);
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 hover:border-emerald-500/40 cursor-pointer transition-all"
                                >
                                  BUY
                                </button>
                                <button
                                  onClick={() => {
                                    setTradeStock(w);
                                    setTradeType("sell");
                                    setTradeShares(10);
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 hover:border-rose-500/40 cursor-pointer transition-all"
                                >
                                  SELL
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Market Performance Heatmap Grid */}
                {showHeatmapWidget && (
                  <motion.div 
                    layout
                    className="col-span-1 md:col-span-2 liquid-glass rounded-xl p-5 border border-white/5 text-left"
                    id="widget-heatmap"
                  >
                    <h4 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3 mb-4">
                      Market Heatmap Performers (Sector Map)
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3" id="heatmap-cells">
                      {stocks.filter(s => s.symbol !== "NIFTY50" && s.symbol !== "SENSEX" && s.symbol !== "BANKNIFTY").map((stk) => {
                        const pct = stk.percentChange;
                        const isGreen = pct >= 0;
                        const absPct = Math.min(4, Math.abs(pct)); // cap color scale saturation
                        
                        // Pick glowing background color based on percentage bounds
                        let bgStyle = "rgba(16, 185, 129, 0.05)";
                        let borderStyle = "rgba(16, 185, 129, 0.2)";
                        let textStyle = "text-emerald-300";

                        if (isGreen) {
                          if (absPct > 2) {
                            bgStyle = "rgba(16, 185, 129, 0.25)";
                            borderStyle = "rgba(16, 185, 129, 0.5)";
                          } else {
                            bgStyle = "rgba(16, 185, 129, 0.12)";
                            borderStyle = "rgba(16, 185, 129, 0.3)";
                          }
                        } else {
                          textStyle = "text-rose-300";
                          if (absPct > 2) {
                            bgStyle = "rgba(244, 63, 94, 0.25)";
                            borderStyle = "rgba(244, 63, 94, 0.5)";
                          } else {
                            bgStyle = "rgba(244, 63, 94, 0.12)";
                            borderStyle = "rgba(244, 63, 94, 0.3)";
                          }
                        }

                        return (
                          <div 
                            key={stk.symbol}
                            onClick={() => onNavigate(`/stock/${stk.symbol.toLowerCase()}`)}
                            className={`p-3 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 flex flex-col justify-between h-18`}
                            style={{ backgroundColor: bgStyle, borderColor: borderStyle }}
                            id={`heatmap-cell-${stk.symbol.toLowerCase()}`}
                          >
                            <span className="text-xs font-bold text-white block truncate">{stk.symbol}</span>
                            <span className={`text-[10px] font-semibold font-mono ${textStyle}`}>
                              {pct >= 0 ? "+" : ""}{pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Leaders stats (Gainers and Losers) */}
                {showStatsWidget && (
                  <motion.div 
                    layout
                    className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
                    id="widget-leaderboards"
                  >
                    {/* Gainers */}
                    <div className="liquid-glass rounded-xl p-5 border border-white/5 text-left">
                      <h5 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider border-b border-emerald-500/15 pb-2.5 mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>Daily Top Gainers</span>
                      </h5>
                      <div className="space-y-2">
                        {topGainers.map((g) => (
                          <div 
                            key={g.symbol} 
                            onClick={() => onNavigate(`/stock/${g.symbol.toLowerCase()}`)}
                            className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors cursor-pointer text-xs"
                          >
                            <span className="font-bold text-white">{g.symbol}</span>
                            <span className="text-white/50 font-mono">{g.name}</span>
                            <span className="font-mono text-emerald-400 font-bold">+{g.percentChange}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Losers */}
                    <div className="liquid-glass rounded-xl p-5 border border-white/5 text-left">
                      <h5 className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider border-b border-rose-500/15 pb-2.5 mb-3 flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4" />
                        <span>Daily Top Losers</span>
                      </h5>
                      <div className="space-y-2">
                        {topLosers.map((l) => (
                          <div 
                            key={l.symbol} 
                            onClick={() => onNavigate(`/stock/${l.symbol.toLowerCase()}`)}
                            className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors cursor-pointer text-xs"
                          >
                            <span className="font-bold text-white">{l.symbol}</span>
                            <span className="text-white/50 font-mono">{l.name}</span>
                            <span className="font-mono text-rose-400 font-bold">{l.percentChange}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Bullish Radar (Top 5) */}
                    <div className="liquid-glass rounded-xl p-5 border border-white/5 text-left flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider border-b border-emerald-500/15 pb-2.5 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            <span>Top Bullish Stocks Today</span>
                          </div>
                          <span className="text-[10px] font-normal text-white/40">Top 5</span>
                        </h5>
                        <div className="space-y-2">
                          {topBullish.map(({ stock, score }) => (
                            <div 
                              key={stock.symbol} 
                              onClick={() => onNavigate(`/stock/${stock.symbol.toLowerCase()}`)}
                              className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors cursor-pointer text-xs"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-white">{stock.symbol}</span>
                                <span className="text-[9px] text-white/40 truncate max-w-[120px]">{stock.sector}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-white/50">₹{stock.price.toFixed(0)}</span>
                                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">{score}% Score</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate("/market/bullish")}
                        className="mt-4 w-full py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 font-mono tracking-wider transition-all"
                      >
                        LAUNCH FULL BULLISH RADAR
                      </button>
                    </div>

                    {/* Top Bearish Radar (Top 5) */}
                    <div className="liquid-glass rounded-xl p-5 border border-white/5 text-left flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider border-b border-rose-500/15 pb-2.5 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingDown className="w-4 h-4" />
                            <span>Top Bearish Stocks Today</span>
                          </div>
                          <span className="text-[10px] font-normal text-white/40">Top 5</span>
                        </h5>
                        <div className="space-y-2">
                          {topBearish.map(({ stock, score }) => (
                            <div 
                              key={stock.symbol} 
                              onClick={() => onNavigate(`/stock/${stock.symbol.toLowerCase()}`)}
                              className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors cursor-pointer text-xs"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-white">{stock.symbol}</span>
                                <span className="text-[9px] text-white/40 truncate max-w-[120px]">{stock.sector}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-white/50">₹{stock.price.toFixed(0)}</span>
                                <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">{score}% Score</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate("/market/bearish")}
                        className="mt-4 w-full py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold text-rose-400 font-mono tracking-wider transition-all"
                      >
                        LAUNCH FULL BEARISH RADAR
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW B & C: INDIAN & FOREX STOCK TABLES */}
          {/* ===============================          {/* ========================================================= */}
          {/* VIEW B: INDIAN MARKET HUB & STOCK EXPLORER */}
          {/* ========================================================= */}
          {isStocksRoute && (
            <div className="space-y-6 animate-fade-in" id="terminal-view-stock-explorer">
              
              {/* Screening & Filter Panel */}
              <div className="liquid-glass rounded-xl p-5 border border-white/5 text-left space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Indian Market Hub</h2>
                    <p className="text-xs text-white/40">Real-time NSE/BSE dynamic screening, order books & capital indices.</p>
                  </div>
                  
                  {/* Dynamic Custom Ticker Input for searching/adding unknown stocks */}
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                    <input 
                      type="text"
                      placeholder="Symbol (e.g. ZOMATO)"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none px-2 py-1 w-full max-w-[140px]"
                    />
                    <button
                      onClick={async () => {
                        const sym = stockSearchQuery.toUpperCase().trim();
                        if (!sym) return;
                        setAddingCustomTicker(true);
                        setCustomTickerError("");
                        try {
                          const res = await marketApi.getStockBySymbol(sym);
                          if (res) {
                            const updated = await marketApi.getAllStocks();
                            setStocks(updated);
                            setStockSearchQuery("");
                            onNavigate(`/stock/${sym.toLowerCase()}`);
                          } else {
                            setCustomTickerError(`Ticker "${sym}" not found.`);
                          }
                        } catch (err) {
                          setCustomTickerError("Error initializing ticker.");
                        } finally {
                          setAddingCustomTicker(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#3D81E3] text-black hover:bg-[#3D81E3]/80 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      {addingCustomTicker ? "..." : "LOAD"}
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" id="stock-explorer-filters-grid">
                  {/* Sector Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Sector Group</label>
                    <select
                      value={stockSectorFilter}
                      onChange={(e) => setStockSectorFilter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#3D81E3]/50 cursor-pointer"
                    >
                      <option value="All" className="bg-[#0B0F19]">All Sectors</option>
                      {["Banking", "IT", "Automobile", "Pharma", "Energy", "FMCG", "Finance", "Infrastructure", "Metals", "Telecom"].map(sec => (
                        <option key={sec} value={sec} className="bg-[#0B0F19]">{sec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Market Cap Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Market Cap</label>
                    <select
                      value={stockCapFilter}
                      onChange={(e) => setStockCapFilter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#3D81E3]/50 cursor-pointer"
                    >
                      <option value="All" className="bg-[#0B0F19]">All Caps</option>
                      <option value="Large" className="bg-[#0B0F19]">Large Cap (&gt;= ₹2.0T)</option>
                      <option value="Mid" className="bg-[#0B0F19]">Mid Cap (₹0.5T - ₹2.0T)</option>
                      <option value="Small" className="bg-[#0B0F19]">Small Cap (&lt; ₹0.5T)</option>
                    </select>
                  </div>

                  {/* Price Movement Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Price Movement</label>
                    <select
                      value={stockMovementFilter}
                      onChange={(e) => setStockMovementFilter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#3D81E3]/50 cursor-pointer"
                    >
                      <option value="All" className="bg-[#0B0F19]">All Changes</option>
                      <option value="Gainers" className="bg-[#0B0F19]">Gainers Only (▲)</option>
                      <option value="Losers" className="bg-[#0B0F19]">Losers Only (▼)</option>
                    </select>
                  </div>
                </div>

                {customTickerError && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{customTickerError}</p>
                )}
              </div>

              {/* Dynamic Grid of Stock Cards */}
              {displayedStocks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="stocks-explorer-bento">
                  {displayedStocks.map((stk) => {
                    const isUp = stk.percentChange >= 0;
                    const isWatching = watchlist.includes(stk.symbol);
                    return (
                      <motion.div 
                        key={stk.symbol} 
                        whileTap={{ scale: 0.98 }}
                        className="liquid-glass border border-white/5 hover:border-[#3D81E3]/20 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:bg-white/[0.01] transition-all group relative overflow-hidden"
                        id={`card-stock-${stk.symbol.toLowerCase()}`}
                      >
                        {/* Top Row: Tag & Watchlist */}
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold font-mono text-white/50 border border-white/15">
                            {stk.exchange || "NSE"} • {stk.sector || "General"}
                          </span>
                          <button 
                            onClick={() => onToggleWatchlist(stk.symbol)}
                            className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                              isWatching 
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300" 
                                : "border-white/10 text-white/30 hover:text-white"
                            }`}
                            aria-label="Toggle watchlist"
                          >
                            <Bookmark className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Mid Section: Name & Symbol */}
                        <div className="text-left">
                          <div 
                            onClick={() => onNavigate(`/stock/${stk.symbol.toLowerCase()}`)}
                            className="font-bold text-white text-base font-mono cursor-pointer hover:text-[#3D81E3] hover:underline flex items-center gap-1.5"
                          >
                            <span>{stk.symbol}</span>
                            <span className="text-[10px] text-white/30 font-normal uppercase font-sans">
                              {getCapCategory(stk.marketCap)} Cap
                            </span>
                          </div>
                          <div className="text-xs text-white/50 truncate font-sans mt-0.5" title={stk.name}>
                            {stk.name}
                          </div>
                        </div>

                        {/* Price Row */}
                        <div className="flex items-baseline justify-between border-t border-b border-white/[0.03] py-2.5">
                          <div className="text-lg font-bold font-mono text-white">
                            ₹{stk.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs font-bold font-mono flex items-center gap-0.5 ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                            <span>{isUp ? "▲" : "▼"}</span>
                            <span>{isUp ? "+" : ""}{stk.percentChange}%</span>
                          </div>
                        </div>

                        {/* High/Low & Volume Details */}
                        <div className="grid grid-cols-2 gap-2 text-left text-[10px] font-mono text-white/40">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-white/20">Volume</span>
                            <span className="text-white/75">{stk.volume || "—"}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-white/20">Day Range</span>
                            <span className="text-white/75 truncate block">
                              {stk.dayLow?.toLocaleString()}-{stk.dayHigh?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Connection & Freshness Metadata */}
                        <div className="border-t border-white/[0.03] pt-2 mt-1 space-y-1 text-left font-mono text-[9px] text-white/45">
                          <div className="flex items-center justify-between">
                            <span>Src: <strong className="text-white/70">{stk.source || stk.debug?.provider || "Simulation"}</strong></span>
                            <span className={`px-1 rounded text-[8px] font-bold ${
                              stk.dataStatus === "LIVE" ? "text-emerald-400 bg-emerald-500/10" :
                              stk.dataStatus === "DELAYED" ? "text-amber-400 bg-amber-500/10" :
                              "text-cyan-400 bg-cyan-500/10"
                            }`}>{stk.dataStatus || "DEMO"}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/35">
                            <span>Updated:</span>
                            <span>{stk.timestamp ? new Date(stk.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now"}</span>
                          </div>
                          {stk.priceDiscrepancy && (
                            <div className="text-rose-400 font-bold flex items-center gap-0.5 text-[8px] bg-rose-500/10 p-1 rounded border border-rose-500/20">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                              <span>Price discrepancy detected (&gt;2%)</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button 
                            onClick={() => onNavigate(`/stock/${stk.symbol.toLowerCase()}`)}
                            className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-white border border-white/10 cursor-pointer text-[10px] font-bold transition-all uppercase tracking-wide"
                          >
                            Chart
                          </button>
                          <button 
                            onClick={() => {
                              setTradeStock(stk);
                              setTradeType("buy");
                            }}
                            className="py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/30 cursor-pointer text-[10px] font-bold transition-all uppercase tracking-wide"
                          >
                            Trade
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-12 border border-white/5 bg-white/[0.02] rounded-xl space-y-4">
                  <Search className="w-8 h-8 mx-auto text-white/20" />
                  <h3 className="text-sm font-semibold text-white">No listed tickers match current screens</h3>
                  <p className="text-xs text-white/40 max-w-md mx-auto">
                    Try searching a custom symbol like <strong>WIPRO</strong>, <strong>ZOMATO</strong>, or <strong>IRCTC</strong> in the input above to index and monitor it instantly.
                  </p>
                  <button
                    onClick={() => {
                      setStockSearchQuery("");
                      setStockSectorFilter("All");
                      setStockCapFilter("All");
                      setStockMovementFilter("All");
                    }}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-white cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW D: AI NEWS ENGINE */}
          {/* ========================================================= */}
          {isNewsRoute && (
            <div className="space-y-6" id="terminal-view-news">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2" id="news-category-filters">
                {(["All", "Breaking", "Company", "Global", "Economy"] as const).map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveNewsCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      activeNewsCategory === cat 
                        ? "bg-[#3D81E3] text-black shadow-md" 
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                    id={`news-filter-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* News Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="news-grid-cards">
                {displayedNews.map((article) => {
                  const isPositive = article.impactDirection === "Positive";
                  const isNegative = article.impactDirection === "Negative";
                  
                  return (
                    <div 
                      key={article.id}
                      className="liquid-glass rounded-xl p-5 border border-white/5 bg-[#0B0F19]/90 text-left flex flex-col justify-between space-y-4"
                      id={`news-article-${article.id}`}
                    >
                      <div className="space-y-3">
                        {/* Upper category / impact info */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-white/40">{article.source} · {article.time}</span>
                          <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                            isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : isNegative ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {article.marketImpact} Impact
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                          {article.title}
                        </h4>

                        {/* Snippet */}
                        <p className="text-xs text-white/50 leading-relaxed font-sans">
                          {article.preview}
                        </p>
                      </div>

                      {/* AI Impact summary block */}
                      {newsAnalysisData[article.id] ? (
                        <div className="liquid-glass rounded-lg p-3 text-[11px] bg-cyan-950/40 border border-[#22d3ee]/30 text-left">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5 font-mono">
                            <div className="flex items-center gap-1 text-[#22d3ee] font-bold">
                              <Sparkles className="w-3 h-3 text-[#22d3ee] fill-[#22d3ee]/20" />
                              <span>REALTIME AI REPORT</span>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              newsAnalysisData[article.id].sentiment === "Bullish" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                              newsAnalysisData[article.id].sentiment === "Bearish" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                              {newsAnalysisData[article.id].sentiment} ({newsAnalysisData[article.id].confidence}%)
                            </span>
                          </div>
                          <p className="text-white/85 leading-relaxed font-sans text-justify">
                            {newsAnalysisData[article.id].explanation}
                          </p>
                        </div>
                      ) : (
                        <div className="liquid-glass rounded-lg p-3 text-[11px] bg-[#0B0F19] border border-cyan-500/10 text-left flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5 font-mono">
                              <div className="flex items-center gap-1 text-cyan-300 font-bold">
                                <Sparkles className="w-3 h-3 fill-cyan-400/20" />
                                <span>AI Smart Impact Summary</span>
                              </div>
                              <button
                                onClick={async () => {
                                  setAnalyzingNewsId(article.id);
                                  try {
                                    const result = await newsApi.analyzeNewsSentiment(article.title, article.preview);
                                    setNewsAnalysisData(prev => ({ ...prev, [article.id]: result }));
                                  } catch (err) {
                                    console.log(err);
                                  } finally {
                                    setAnalyzingNewsId(null);
                                  }
                                }}
                                disabled={analyzingNewsId === article.id}
                                className="text-[9px] text-[#22d3ee] underline hover:text-white cursor-pointer"
                              >
                                {analyzingNewsId === article.id ? "Analyzing..." : "Deep AI Scan"}
                              </button>
                            </div>
                            <p className="text-white/70 leading-relaxed font-sans text-justify">
                              {article.aiSummary}
                            </p>
                          </div>
                          
                          <button
                            onClick={async () => {
                              setAnalyzingNewsId(article.id);
                              try {
                                const result = await newsApi.analyzeNewsSentiment(article.title, article.preview);
                                setNewsAnalysisData(prev => ({ ...prev, [article.id]: result }));
                              } catch (err) {
                                console.log(err);
                              } finally {
                                setAnalyzingNewsId(null);
                              }
                            }}
                            disabled={analyzingNewsId === article.id}
                            className="mt-2.5 text-[10px] font-bold py-1 px-2 rounded border border-[#22d3ee]/20 bg-[#22d3ee]/5 text-[#22d3ee] hover:bg-[#22d3ee]/15 cursor-pointer flex items-center justify-center gap-1 w-full"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{analyzingNewsId === article.id ? "Analyzing with AI..." : "Deep AI Sentiment Scan"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW E: QUANT LEARNING ACADEMY */}
          {/* ========================================================= */}
          {isLearnRoute && (
            <div className="space-y-6" id="terminal-view-learn">
              
              <div className="text-left max-w-xl">
                <h2 className="text-lg font-bold text-white tracking-wide">AI Learning Academy</h2>
                <p className="text-xs text-white/40">Acquire technical strategies from basic order flow mechanics up to complex machine learning quant algorithms.</p>
              </div>

              {/* Lessons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="lessons-grid-scroller">
                {LESSONS.map((lsn) => (
                  <motion.div 
                    key={lsn.id}
                    whileTap={{ scale: 0.98 }}
                    className="liquid-glass rounded-xl p-5 border border-white/5 bg-[#0B0F19]/90 text-left flex flex-col justify-between h-56"
                    id={`lesson-card-${lsn.id}`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-3">
                        <span className="text-[#3D81E3] uppercase">{lsn.category}</span>
                        <span className="text-white/30">{lsn.level} · {lsn.time}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight mb-2">
                        {lsn.title}
                      </h4>

                      <p className="text-xs text-white/50 leading-relaxed font-sans line-clamp-3">
                        {lsn.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                        {lsn.strategy}
                      </span>

                      <button 
                        onClick={() => setSelectedLesson(lsn)}
                        className="text-xs font-semibold text-white hover:text-[#3D81E3] transition-colors cursor-pointer flex items-center gap-1.5"
                        id={`btn-learn-strategy-${lsn.id}`}
                      >
                        <span>Learn Strategy</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIMULATED STOCK TRADE POPUP (BUY / SELL MODAL) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {tradeStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="trade-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="liquid-glass rounded-2xl p-6 max-w-sm w-full border border-white/10 bg-[#0B0F19] text-left space-y-6"
              id="trade-modal-box"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Execute Simulated Order</h3>
                  <p className="text-[10px] text-white/40 font-mono">{tradeStock.symbol} · {tradeStock.name}</p>
                </div>
                <button 
                  onClick={() => setTradeStock(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer border border-white/5"
                  id="btn-close-trade"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Buy vs Sell selection tabs */}
              <div className="flex bg-white/5 p-1 rounded-md" id="trade-type-selector">
                <button 
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                    tradeType === "buy" ? "bg-emerald-500 text-black shadow-md" : "text-white/50 hover:text-white"
                  }`}
                  id="btn-trade-buy"
                >
                  BUY
                </button>
                <button 
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                    tradeType === "sell" ? "bg-rose-500 text-black shadow-md" : "text-white/50 hover:text-white"
                  }`}
                  id="btn-trade-sell"
                >
                  SELL
                </button>
              </div>

              {/* Price metric */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono" id="trade-price-metrics">
                <div>
                  <span className="text-white/40 block">Market Rate</span>
                  <span className="font-bold text-white text-base">₹{tradeStock.price.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Cash Balance</span>
                  <span className="font-bold text-cyan-300">₹{userBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Quantity input */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-mono uppercase block" htmlFor="shares-qty-input">Shares Quantity</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setTradeShares(prev => Math.max(1, prev - 5))}
                    className="w-10 h-10 rounded border border-[var(--border-color)] hover:border-white/20 bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-primary)] font-bold cursor-pointer transition-colors"
                  >
                    -5
                  </button>
                  <input 
                    id="shares-qty-input"
                    type="number" 
                    value={tradeShares}
                    onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-10 bg-[var(--bg-card)] text-center rounded text-[var(--text-primary)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-brand"
                  />
                  <button 
                    onClick={() => setTradeShares(prev => prev + 5)}
                    className="w-10 h-10 rounded border border-[var(--border-color)] hover:border-white/20 bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-primary)] font-bold cursor-pointer transition-colors"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Order total */}
              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono" id="trade-order-total">
                <span className="text-white/40">Estimated Transaction Cost</span>
                <span className="font-bold text-white">₹{(tradeStock.price * tradeShares).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
              </div>

              {/* Action Button */}
              <button 
                onClick={executeSimulatedTrade}
                className={`w-full py-3 rounded-full text-black font-semibold text-xs cursor-pointer transition-all ${
                  tradeType === "buy" ? "bg-emerald-400 hover:bg-emerald-300" : "bg-rose-400 hover:bg-rose-300"
                }`}
                id="btn-execute-order"
              >
                Execute {tradeType.toUpperCase()} Order
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* IMMERSIVE LEARN ACADEMY LESSON MODAL (FULL VIEWER) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="lesson-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="liquid-glass rounded-2xl max-w-2xl w-full border border-white/10 bg-[#0B0F19] flex flex-col h-[80vh]"
              id="lesson-modal-box"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20" id="lesson-modal-header">
                <div>
                  <span className="text-[10px] font-mono text-[#3D81E3] font-bold uppercase">{selectedLesson.category} · Strategy Lesson</span>
                  <h3 className="text-base font-bold text-white mt-1">{selectedLesson.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedLesson(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer border border-white/5"
                  id="btn-close-lesson"
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Content Scroller */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left" id="lesson-modal-body">
                
                {/* Introduction */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-[#3D81E3] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono uppercase mb-1">Strategy Focus: {selectedLesson.strategy}</h4>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">{selectedLesson.description}</p>
                  </div>
                </div>

                {/* Lesson Sections */}
                <div className="space-y-5" id="lesson-sections">
                  {selectedLesson.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      <h4 className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{sec.title}</span>
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed font-sans text-justify bg-black/10 p-3.5 rounded-lg border border-white/5">
                        {sec.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Knowledge Check block */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2">
                    <Check className="w-4 h-4" />
                    <span>Real-world terminal application rules</span>
                  </div>
                  <p className="text-white/70 leading-relaxed font-sans">
                    Apply this lesson directly to our interactive Stock charts. Open RELIANCE, TCS, or EUR/USD, toggle indicators (such as SMA, RSI, Bollinger Bands), and check if the real-time prices pull back or break out according to this strategy framework.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-white/40 font-mono" id="lesson-modal-footer">
                <span>Completed Lessons grant Mock Portfolio multiplier access</span>
                <button 
                  onClick={() => setSelectedLesson(null)}
                  className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs cursor-pointer hover:bg-white/90"
                  id="btn-lesson-complete"
                >
                  Mark as Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terminal Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-[10px] text-white/30 font-mono bg-black/20 relative z-10">
        <p>© 2026 MarketVerse Terminal Network. Secured server-side financial telemetry.</p>
      </footer>
    </div>
  );
};
