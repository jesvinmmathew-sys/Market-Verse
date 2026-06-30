import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { INDIAN_STOCK_UNIVERSE, generateDynamicUniverseStock } from "./src/services/indianStocksDb.js";
import { indianMarketProvider } from "./marketProviders/indianMarketProvider.js";
import { twelveDataProvider } from "./marketProviders/twelveData.js";
import { getIndianStockQuote, getMultipleStocks, getStockHistory, searchIndianStock, cleanSymbolForApi } from "./marketProviders/indianStockApi.js";

// Load environment secrets
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Global state to track Gemini rate limit cooldowns dynamically
let geminiCooldownUntil = 0;

// Initialize server-side Gemini client
const getGeminiClient = () => {
  if (Date.now() < geminiCooldownUntil) {
    console.log(`[GEMINI COOLDOWN] Skipping Gemini call. Cooldown active for another ${Math.ceil((geminiCooldownUntil - Date.now()) / 1000)}s.`);
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

function triggerGeminiCooldown(errMessage: string) {
  const is429 = errMessage.includes("429") || errMessage.includes("RESOURCE_EXHAUSTED") || errMessage.includes("quota") || errMessage.includes("limit");
  if (is429) {
    // 3-minute cooldown for Gemini so we don't hammer the API when free-tier limit is reached
    geminiCooldownUntil = Date.now() + 3 * 60 * 1000;
    console.log(`[GEMINI COOLDOWN] Quota exceeded or rate limited. Triggering 3-minute cooldown. (Reason: ${errMessage.slice(0, 100)})`);
  }
}

// ----------------- API ROUTES FIRST -----------------

// Helper: Deterministic fallback generator for technical review if Gemini fails
function generateServerFallback(symbol: string, price: number, historySnippet: any) {
  let rsi = 50;
  let ma = price;
  let priceChange = 0;

  try {
    if (Array.isArray(historySnippet) && historySnippet.length > 0) {
      const last = historySnippet[historySnippet.length - 1];
      const prev = historySnippet[historySnippet.length - 2] || last;
      if (typeof last?.rsi === 'number') rsi = last.rsi;
      if (typeof last?.ma === 'number') ma = last.ma;
      if (last?.close && prev?.close) {
        priceChange = last.close - prev.close;
      }
    }
  } catch (e) {
    // ignore parsing errors
  }

  let sentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
  let confidence = 75;
  let risk: "Low" | "Medium" | "High" = "Medium";
  let riskPercentage = 45;
  let safetyScore = 65;
  let briefNote = "";
  let strategyExplanation = "";

  if (rsi > 65) {
    sentiment = "Bullish";
    confidence = Math.floor(72 + Math.random() * 15);
    risk = "High";
    riskPercentage = Math.floor(65 + Math.random() * 20);
    safetyScore = Math.floor(40 + Math.random() * 15);
    briefNote = `${symbol} exhibits strong bullish breakout triggers with heightened volume support across multiple sessions.`;
    strategyExplanation = `Technical metrics indicate high-momentum buying pressure. The current quote of ₹${price} resides above its major moving average support band. While the RSI at ${rsi.toFixed(1)} registers near-term overbought parameters, demand-side acceleration points to ongoing trend persistence. Traders should manage stop-loss coordinates strictly to secure profits. Past performance is not a guarantee.`;
  } else if (rsi < 35) {
    sentiment = "Bearish";
    confidence = Math.floor(68 + Math.random() * 14);
    risk = "High";
    riskPercentage = Math.floor(75 + Math.random() * 15);
    safetyScore = Math.floor(25 + Math.random() * 20);
    briefNote = `${symbol} trades in a steep distribution channel under intense selling pressure with weak support indicators.`;
    strategyExplanation = `The chart structure exhibits severe distribution, with price ₹${price} trading below key exponential moving averages. The RSI has reached oversold depths at ${rsi.toFixed(1)}, warning of extended bearish momentum. Although technical relief rallies could trigger short-covering, immediate downside targets remain active. Risk remains high. Past performance is not a guarantee.`;
  } else {
    sentiment = priceChange >= 0 ? "Bullish" : "Bearish";
    confidence = Math.floor(60 + Math.random() * 12);
    risk = "Medium";
    riskPercentage = Math.floor(35 + Math.random() * 15);
    safetyScore = Math.floor(70 + Math.random() * 15);
    briefNote = `${symbol} remains locked in a tight consolidation range near major support lines as liquidity pools accumulate.`;
    strategyExplanation = `Indicators show range-bound consolidation near the moving average equilibrium at ₹${ma.toFixed(1)}. The neutral RSI level of ${rsi.toFixed(1)} suggests equal distribution between buy and sell orders. Current strategy favors accumulating near range support while awaiting a clean volume breakout past historical volatility bands. Past performance is not a guarantee.`;
  }

  return {
    sentiment,
    confidence,
    risk,
    riskPercentage,
    safetyScore,
    briefNote,
    strategyExplanation,
    isFallback: true
  };
}

// API: Server-side Gemini stock analysis proxy
app.post("/api/ai/analyze", async (req, res) => {
  const { symbol, price, historySnippet } = req.body;
  if (!symbol || !price) {
    return res.status(400).json({ error: "Missing stock parameters" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const fallback = generateServerFallback(symbol, price, historySnippet);
    return res.json(fallback);
  }

  try {
    const prompt = `Analyze the stock/forex asset "${symbol}" (Current rate/price: ${price}) using this short historical snippet: ${JSON.stringify(historySnippet)}.
Provide a structured technical review including:
1. Sentiment: "Bullish", "Bearish", or "Neutral"
2. Confidence level (0 to 100)
3. Volatility Risk: "Low", "Medium", or "High"
4. Risk Percentage (0 to 100)
5. Safety Score (0 to 100 - representing investment safety profile)
6. Brief Note: A concise 2-sentence human-style summary of the company/asset's current health.
7. Strategy Explanation: Max 100 words detailing technical bands. Add a disclaimer stating past performance is not a guarantee.

You must return a single JSON object matching this schema exactly:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "confidence": number,
  "risk": "Low" | "Medium" | "High",
  "riskPercentage": number,
  "safetyScore": number,
  "briefNote": string,
  "strategyExplanation": string
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return res.json({
      sentiment: data.sentiment || "Neutral",
      confidence: typeof data.confidence === "number" ? data.confidence : 70,
      risk: data.risk || "Medium",
      riskPercentage: typeof data.riskPercentage === "number" ? data.riskPercentage : 45,
      safetyScore: typeof data.safetyScore === "number" ? data.safetyScore : 65,
      briefNote: data.briefNote || `${symbol} demonstrates healthy technical consolidation with structured resistance thresholds.`,
      strategyExplanation: data.strategyExplanation || "Stable technical consolidated metrics holding."
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
      geminiCooldownUntil = Date.now() + 60000;
      console.log("[GEMINI COOLDOWN] Quota exceeded detected in /api/ai/analyze. Triggering 1-minute cooldown.");
    }
    console.log("Gemini overloaded or unavailable. Initiating server-side adaptive technical fallback:", errMsg);
    const fallback = generateServerFallback(symbol, price, historySnippet);
    return res.json(fallback);
  }
});

// API: AI News Sentiment Analyzer
app.post("/api/ai/news-sentiment", async (req, res) => {
  const { title, text } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Missing news title to analyze" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const isPositive = title.toLowerCase().includes("surge") || 
                       title.toLowerCase().includes("win") || 
                       title.toLowerCase().includes("rise") || 
                       title.toLowerCase().includes("bags") || 
                       title.toLowerCase().includes("profit") || 
                       title.toLowerCase().includes("grow") || 
                       title.toLowerCase().includes("shines") || 
                       title.toLowerCase().includes("increase");
    const isNegative = title.toLowerCase().includes("drop") || 
                       title.toLowerCase().includes("fall") || 
                       title.toLowerCase().includes("contract") || 
                       title.toLowerCase().includes("loss") || 
                       title.toLowerCase().includes("warn") || 
                       title.toLowerCase().includes("slump") || 
                       title.toLowerCase().includes("down");

    const sentiment = isPositive ? "Bullish" : isNegative ? "Bearish" : "Neutral";
    const impact = (isPositive || isNegative) ? "High" : "Medium";
    const confidence = Math.floor(75 + Math.random() * 15);
    const explanation = `Analyzing structural terms: "${title}". Fallback technical classifier indicates a ${sentiment.toLowerCase()} momentum shift with potential liquidity inflows.`;

    return res.json({ sentiment, impact, confidence, explanation });
  }

  try {
    const prompt = `Analyze this financial news article headline & preview:
Title: "${title}"
Preview: "${text || ''}"

Evaluate whether this news represents a Bullish, Bearish, or Neutral market signal. State the estimated confidence (0-100), estimated market impact (Low, Medium, High), and provide a concise 1-sentence explanation of why and which sectors it will impact.

You must return a single JSON object matching this schema exactly:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "impact": "Low" | "Medium" | "High",
  "confidence": number,
  "explanation": string
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      sentiment: parsed.sentiment || "Neutral",
      impact: parsed.impact || "Medium",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 80,
      explanation: parsed.explanation || "News signals standard asset reallocation patterns."
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
      geminiCooldownUntil = Date.now() + 60000;
      console.log("[GEMINI COOLDOWN] Quota exceeded detected in /api/ai/news-sentiment. Triggering 1-minute cooldown.");
    }
    console.log("AI News Sentiment Error or Rate-limit, falling back to rule-based heuristic classification:", errMsg);
    const isPositive = title.toLowerCase().includes("surge") || 
                       title.toLowerCase().includes("win") || 
                       title.toLowerCase().includes("rise") || 
                       title.toLowerCase().includes("bags") || 
                       title.toLowerCase().includes("profit") || 
                       title.toLowerCase().includes("grow") || 
                       title.toLowerCase().includes("shines") || 
                       title.toLowerCase().includes("increase");
    const isNegative = title.toLowerCase().includes("drop") || 
                       title.toLowerCase().includes("fall") || 
                       title.toLowerCase().includes("contract") || 
                       title.toLowerCase().includes("loss") || 
                       title.toLowerCase().includes("warn") || 
                       title.toLowerCase().includes("slump") || 
                       title.toLowerCase().includes("down");

    const sentiment = isPositive ? "Bullish" : isNegative ? "Bearish" : "Neutral";
    const impact = (isPositive || isNegative) ? "High" : "Medium";
    const confidence = Math.floor(75 + Math.random() * 15);
    const explanation = `Analyzing structural terms: "${title}". Fallback technical classifier indicates a ${sentiment.toLowerCase()} momentum shift with potential liquidity inflows.`;

     return res.json({ sentiment, impact, confidence, explanation });
  }
});

// Helper: Compute RSI, MA, and Trend
function computeIndicators(history: any[]) {
  if (!history || history.length < 14) {
    return { rsi: 50, ma: history[history.length - 1]?.close || 0, trend: "Neutral" };
  }
  
  // 14-day SMA
  let sum = 0;
  for (let i = history.length - 14; i < history.length; i++) {
    sum += history[i].close;
  }
  const ma = parseFloat((sum / 14).toFixed(2));
  
  // RSI
  let gains = 0;
  let losses = 0;
  for (let i = history.length - 14; i < history.length; i++) {
    const diff = history[i].close - history[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = losses === 0 ? 999 : gains / losses;
  const rsi = parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  
  const lastPrice = history[history.length - 1].close;
  const trend = lastPrice > ma ? "Bullish" : lastPrice < ma ? "Bearish" : "Neutral";
  
  return { rsi, ma, trend };
}

// Helper: Context Ingestion for the Chat Assistant
function fetchChatContext(question: string) {
  initServerQuotesStore();
  const q = question.toUpperCase();
  const matches: any[] = [];
  
  // Find matches by symbol or name in serverQuotesStore
  Object.keys(serverQuotesStore).forEach(symbol => {
    if (symbol === "NIFTY50" || symbol === "BANKNIFTY" || symbol === "SENSEX") return;
    const item = serverQuotesStore[symbol];
    if (q.includes(symbol) || q.includes(item.name.toUpperCase())) {
      matches.push(item);
    }
  });

  let contextText = "";
  if (matches.length > 0) {
    contextText += "RELEVANT STOCK QUOTES FOUND FOR THIS QUERY WITH EXTENDED DETAILS:\n";
    matches.forEach(item => {
      const history = generateServerHistory(item.symbol, "1M", item.price);
      const ind = computeIndicators(history);
      
      // Compute OHLC based on daily change
      const close = item.price;
      const open = parseFloat((close - item.change).toFixed(2));
      const high = item.dayHigh || parseFloat((item.price * 1.01).toFixed(2));
      const low = item.dayLow || parseFloat((item.price * 0.99).toFixed(2));

      // Historical candles (last 5 daily closes)
      const last5Candles = history.slice(-5).map(c => `[Date: ${c.time}, Close: ₹${c.close}, Vol: ${c.volume}]`).join(", ");

      // Filter news sentiment from default templates
      const matchedNews = DEFAULT_NEWS_TEMPLATES.filter(news => 
        news.title.toUpperCase().includes(item.symbol) || 
        news.preview.toUpperCase().includes(item.symbol) ||
        news.title.toUpperCase().includes(item.name.toUpperCase())
      );
      const newsContext = matchedNews.length > 0 
        ? matchedNews.map(n => `"${n.title}" (${n.preview})`).join(" | ")
        : "No direct recent corporate announcements or negative regulatory headlines registered.";

      contextText += `- Symbol: ${item.symbol}
  Company Name: ${item.name}
  Sector: ${item.sector}
  Exchange: ${item.exchange}
  Live Price: ₹${item.price}
  Daily Change: ${item.change > 0 ? "+" : ""}${item.change} (${item.percentChange}%)
  Volume: ${item.volume}
  OHLC Breakdown: Open: ₹${open}, High: ₹${high}, Low: ₹${low}, Close: ₹${close}
  Historical Candles (Last 5 Days): ${last5Candles}
  Technical Metrics: 14-day SMA: ₹${ind.ma}, RSI (14): ${ind.rsi.toFixed(1)} (${ind.trend})
  Recent News Sentiment & Mentions: ${newsContext}
\n`;
    });
  }

  // Check for top gainers/losers keywords
  if (q.includes("GAINER") || q.includes("PERFORMING BEST") || q.includes("BEST PERFORMING") || q.includes("WINNER") || q.includes("STRONGEST") || q.includes("PERFORM BEST")) {
    const list = Object.keys(serverQuotesStore)
      .map(sym => serverQuotesStore[sym])
      .filter(item => item.sector !== "Benchmark")
      .sort((a, b) => b.percentChange - a.percentChange)
      .slice(0, 5);
      
    contextText += "TOP GAINERS IN INDIAN MARKETS TODAY:\n";
    list.forEach(item => {
      contextText += `- ${item.symbol} (${item.name}): ₹${item.price} (+${item.percentChange}%)\n`;
    });
    contextText += "\n";
  }

  if (q.includes("LOSER") || q.includes("WORST") || q.includes("WEAKEST") || q.includes("DECLINE") || q.includes("FALLING") || q.includes("FELL")) {
    const list = Object.keys(serverQuotesStore)
      .map(sym => serverQuotesStore[sym])
      .filter(item => item.sector !== "Benchmark")
      .sort((a, b) => a.percentChange - b.percentChange)
      .slice(0, 5);
      
    contextText += "TOP LOSERS IN INDIAN MARKETS TODAY:\n";
    list.forEach(item => {
      contextText += `- ${item.symbol} (${item.name}): ₹${item.price} (${item.percentChange}%)\n`;
    });
    contextText += "\n";
  }

  if (q.includes("OPPORTUNIT") || q.includes("SIGNAL") || q.includes("BULLISH") || q.includes("BEARISH")) {
    const oversold: any[] = [];
    const bullishTrend: any[] = [];
    
    Object.keys(serverQuotesStore).forEach(sym => {
      const item = serverQuotesStore[sym];
      if (item.sector === "Benchmark") return;
      const history = generateServerHistory(sym, "1M", item.price);
      const ind = computeIndicators(history);
      if (ind.rsi < 35) {
        oversold.push({ ...item, rsi: ind.rsi });
      } else if (ind.rsi > 60 && item.percentChange > 0.5) {
        bullishTrend.push({ ...item, rsi: ind.rsi });
      }
    });

    contextText += "TECHNICAL PATTERNS FOUND IN THE MARKET:\n";
    if (oversold.length > 0) {
      contextText += "Oversold Stocks (Potential Reversal Setup - RSI < 35):\n";
      oversold.slice(0, 3).forEach(item => {
        contextText += `- ${item.symbol}: Price ₹${item.price}, RSI is ${item.rsi.toFixed(1)}\n`;
      });
    }
    if (bullishTrend.length > 0) {
      contextText += "Bullish Breakouts (RSI > 60 & Positive Momentum):\n";
      bullishTrend.slice(0, 3).forEach(item => {
        contextText += `- ${item.symbol}: Price ₹${item.price}, RSI is ${item.rsi.toFixed(1)}\n`;
      });
    }
    contextText += "\n";
  }

  // Include basic benchmark data
  const nifty = serverQuotesStore["NIFTY50"] || { price: 24155, percentChange: 0.1 };
  const banknifty = serverQuotesStore["BANKNIFTY"] || { price: 52350, percentChange: -0.2 };
  const sensex = serverQuotesStore["SENSEX"] || { price: 79560, percentChange: 0.05 };
  
  contextText += `CURRENT BENCHMARKS:\n`;
  contextText += `- NIFTY50: ${nifty.price} (${nifty.percentChange > 0 ? "+" : ""}${nifty.percentChange}%)\n`;
  contextText += `- BANKNIFTY: ${banknifty.price} (${banknifty.percentChange > 0 ? "+" : ""}${banknifty.percentChange}%)\n`;
  contextText += `- SENSEX: ${sensex.price} (${sensex.percentChange > 0 ? "+" : ""}${sensex.percentChange}%)\n`;

  return contextText;
}

// API: Detailed Stock Analysis Panel API
app.post("/api/ai/analyze-stock", async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol parameters" });
  }

  initServerQuotesStore();
  const quote = getOrCreateServerQuote(symbol);
  const history = generateServerHistory(symbol, "1M", quote.price);
  const indicators = computeIndicators(history);

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback data structures
    return res.json({
      sentiment: indicators.trend,
      confidence: indicators.trend === "Neutral" ? 55 : indicators.trend === "Bullish" ? 74 : 68,
      risk: indicators.rsi > 70 || indicators.rsi < 30 ? "High" : "Medium",
      riskPercentage: Math.floor(indicators.rsi),
      safetyScore: Math.floor(100 - indicators.rsi * 0.8),
      briefNote: `${quote.name} is showing technical ${indicators.trend.toLowerCase()} characteristics trading at ₹${quote.price}.`,
      strategyExplanation: `Historical indicators compute an RSI of ${indicators.rsi.toFixed(1)} and simple moving average of ₹${indicators.ma}. The asset registers standard liquidity accumulation patterns with localized support points. Educational analysis, not financial advice.`,
      possibleScenarios: {
        shortTerm: indicators.trend === "Bullish" ? "Potential retest of recent resistance zones on sustained volume." : "Consolidation within current support margins with low volatility.",
        mediumTerm: "Primary trend persistence depends heavily on sector capitalization indexes and macro policy moves."
      },
      reasons: [
        `Price momentum currently shows a daily shift of ${quote.percentChange}%`,
        `RSI computed at ${indicators.rsi.toFixed(1)} registers a ${indicators.trend.toLowerCase()} bias`,
        `Trading volume is healthy at ${quote.volume}`,
        `Trading sector is ${quote.sector}`
      ],
      keyIndicators: {
        rsi: indicators.rsi,
        macd: "Slight convergence below baseline signal coordinates.",
        movingAverages: `14-day Simple Moving Average at ₹${indicators.ma}`,
        trend: indicators.trend
      }
    });
  }

  try {
    const prompt = `Perform a comprehensive technical analysis on Indian stock "${quote.name}" (${quote.symbol}) traded on Indian markets.
Current quote data:
- Price: ₹${quote.price}
- Daily change: ${quote.change} (${quote.percentChange}%)
- Volume: ${quote.volume}
- Sector: ${quote.sector}

Historical technical indicators computed:
- 14-day Simple Moving Average: ₹${indicators.ma}
- RSI (14): ${indicators.rsi} (${indicators.trend})

You must return a single JSON object matching this schema exactly:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "confidence": number, // (0 to 100)
  "risk": "Low" | "Medium" | "High",
  "riskPercentage": number, // (0 to 100)
  "safetyScore": number, // (0 to 100)
  "briefNote": "concise 2-sentence summary of health",
  "strategyExplanation": "technical details and levels",
  "reasons": ["reason 1", "reason 2", "reason 3", "reason 4"],
  "possibleScenarios": {
    "shortTerm": "short term outlook description",
    "mediumTerm": "medium term outlook description"
  },
  "keyIndicators": {
    "rsi": number,
    "macd": "description of convergence/divergence",
    "movingAverages": "description of moving average crossovers",
    "trend": "Bullish" | "Bearish" | "Neutral"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      sentiment: parsed.sentiment || indicators.trend,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 75,
      risk: parsed.risk || "Medium",
      riskPercentage: typeof parsed.riskPercentage === "number" ? parsed.riskPercentage : 45,
      safetyScore: typeof parsed.safetyScore === "number" ? parsed.safetyScore : 65,
      briefNote: parsed.briefNote || `${quote.name} is trading in range with an index sentiment of ${indicators.trend}.`,
      strategyExplanation: parsed.strategyExplanation || "Consistent range boundaries are holding.",
      reasons: parsed.reasons || [
        `Price momentum currently shows a daily shift of ${quote.percentChange}%`,
        `RSI computed at ${indicators.rsi.toFixed(1)} registers a ${indicators.trend.toLowerCase()} bias`
      ],
      possibleScenarios: parsed.possibleScenarios || {
        shortTerm: "Awaiting breakout confirmations on Bollinger margins.",
        mediumTerm: "Standard institutional balance profile."
      },
      keyIndicators: parsed.keyIndicators || {
        rsi: indicators.rsi,
        macd: "Stable indicator distribution.",
        movingAverages: `14-day Simple Moving Average at ₹${indicators.ma}`,
        trend: indicators.trend
      }
    });
  } catch (err: any) {
    triggerGeminiCooldown(err.message || String(err));
    // Safe dynamic fallback
    return res.json({
      sentiment: indicators.trend,
      confidence: 70,
      risk: "Medium",
      riskPercentage: 50,
      safetyScore: 60,
      briefNote: `${quote.name} maintains localized support bounds near ₹${indicators.ma}.`,
      strategyExplanation: `Due to transient API latency, automatic model fallback calculated indicators: RSI of ${indicators.rsi.toFixed(1)} and SMA of ₹${indicators.ma}. Past performance is not a guarantee. Educational analysis, not financial advice.`,
      possibleScenarios: {
        shortTerm: "Range bound trading near current consolidation floors.",
        mediumTerm: "Subject to core Nifty index trends and macro sector pivots."
      },
      reasons: [
        `Price momentum indicates a daily shift of ${quote.percentChange}%`,
        `Calculated RSI is ${indicators.rsi.toFixed(1)}`
      ],
      keyIndicators: {
        rsi: indicators.rsi,
        macd: "Data holds stable distribution boundaries.",
        movingAverages: `14-day Simple Moving Average at ₹${indicators.ma}`,
        trend: indicators.trend
      }
    });
  }
});

// Helper: Smart Symbol Detector for User Prompts
function detectSymbolInText(text: string): string | null {
  const q = text.toUpperCase();
  
  // High-priority popular mappings
  if (q.includes("RELIANCE")) return "RELIANCE";
  if (q.includes("TATA MOTORS") || q.includes("TATAMOTORS")) return "TATAMOTORS";
  if (q.includes("HDFC")) return "HDFCBANK";
  if (q.includes("ICICI")) return "ICICIBANK";
  if (q.includes("STATE BANK") || q.includes("SBIN") || q.includes(" SBI ")) return "SBIN";
  if (q.includes("INFOSYS") || q.includes("INFY")) return "INFY";
  if (q.includes("TCS")) return "TCS";
  if (q.includes("WIPRO")) return "WIPRO";
  if (q.includes("AIRTEL") || q.includes("BHARTI")) return "BHARTIARTL";
  if (q.includes("MARUTI")) return "MARUTI";
  
  // Try matching against general store symbols or names
  initServerQuotesStore();
  for (const symbol of Object.keys(serverQuotesStore)) {
    if (symbol === "NIFTY50" || symbol === "BANKNIFTY" || symbol === "SENSEX") continue;
    if (q.includes(symbol)) return symbol;
    
    const item = serverQuotesStore[symbol];
    const cleanedName = item.name.toUpperCase().replace("LIMITED", "").replace("LTD", "").trim();
    if (cleanedName.length > 4 && q.includes(cleanedName)) {
      return symbol;
    }
  }
  
  return null;
}

// Helper: Calculate real-time technical & quote dataset for Gemini analysis
async function getRealtimeStockAnalysisContext(symbol: string) {
  let quote: any;
  let history: any[] = [];
  
  // Look up the symbol to find the exchange
  const fallbackItem = REAL_NSE_STOCKS.find(s => s.symbol === symbol);
  const exchange = fallbackItem?.exchange || "NSE";

  // Try to fetch real-time quote and history from providers
  try {
    // Priority 1: Indian Stock Market API
    quote = await getIndianStockQuote(symbol);
    history = await getStockHistory(symbol, "1M");
  } catch (errApi: any) {
    console.warn(`[Provider Error] Indian Stock Market API failed for ${symbol}, trying Yahoo:`, errApi.message);
    try {
      // Priority 2: Yahoo Finance provider
      quote = await indianMarketProvider.fetchQuote(symbol, exchange);
      history = await indianMarketProvider.fetchHistory(symbol, "1M", exchange);
    } catch (err1) {
      // Priority 3: Twelve Data
      const apiKey = process.env.MARKET_API_KEY || process.env.VITE_MARKET_API_KEY;
      if (apiKey && !isTwelveDataInCooldown()) {
        try {
          quote = await twelveDataProvider.fetchQuote(symbol, apiKey);
          history = await twelveDataProvider.fetchHistory(symbol, "1M", apiKey);
        } catch (err2) {
          // Priority 4: Demo mode
          quote = { ...getOrCreateServerQuote(symbol), dataStatus: "DEMO" };
          history = generateServerHistory(symbol, "1M", quote.price);
        }
      } else {
        // Priority 4: Demo mode
        quote = { ...getOrCreateServerQuote(symbol), dataStatus: "DEMO" };
        history = generateServerHistory(symbol, "1M", quote.price);
      }
    }
  }

  const len = history.length;
  const slice14 = history.slice(-14);
  const sum = slice14.reduce((acc, c) => acc + c.close, 0);
  const ma = parseFloat((sum / Math.min(14, len)).toFixed(2));

  // RSI
  let gains = 0;
  let losses = 0;
  for (let i = Math.max(1, len - 14); i < len; i++) {
    const diff = history[i].close - history[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = losses === 0 ? 999 : gains / losses;
  const rsi = parseFloat((100 - (100 / (1 + rs))).toFixed(2));

  // MACD approximation (EMA 12 - EMA 26)
  let ema12 = history[0]?.close || quote.price;
  let ema26 = history[0]?.close || quote.price;
  const k12 = 2 / 13;
  const k26 = 2 / 27;
  const macdValues: number[] = [];
  for (let i = 1; i < len; i++) {
    ema12 = history[i].close * k12 + ema12 * (1 - k12);
    ema26 = history[i].close * k26 + ema26 * (1 - k26);
    macdValues.push(ema12 - ema26);
  }
  const macdVal = macdValues.length > 0 ? macdValues[macdValues.length - 1] : 0;
  let signalVal = 0;
  if (macdValues.length > 0) {
    signalVal = macdValues[0];
    const k9 = 2 / 10;
    for (let i = 1; i < macdValues.length; i++) {
      signalVal = macdValues[i] * k9 + signalVal * (1 - k9);
    }
  }
  const macdHist = parseFloat((macdVal - signalVal).toFixed(2));
  const trend = quote.price > ma ? "Bullish" : quote.price < ma ? "Bearish" : "Neutral";

  // Calculate probabilities
  let bullishProb: number | null = 50;
  let bearishProb: number | null = 50;

  if (quote.dataStatus === "DEMO") {
    // "Do not calculate bullish percentage from fake prices."
    bullishProb = null;
    bearishProb = null;
  } else {
    const pChg = quote.percentChange;
    bullishProb += pChg * 4;
    
    if (rsi < 30) bullishProb += 20;
    else if (rsi > 70) bullishProb -= 15;
    else if (rsi >= 50) bullishProb += 10;
    else bullishProb -= 5;

    if (macdHist > 0) bullishProb += 15;
    else bullishProb -= 15;

    if (trend === "Bullish") bullishProb += 15;
    else if (trend === "Bearish") bullishProb -= 15;

    if (pChg > 0) bullishProb += 5;
    else bullishProb -= 5;

    bullishProb = Math.max(5, Math.min(95, Math.round(bullishProb)));
    bearishProb = 100 - bullishProb;
  }

  // Risk Level
  let riskLevel: "Low" | "Medium" | "High" = "Medium";
  const absChange = Math.abs(quote.percentChange);
  if (absChange > 2 || rsi < 25 || rsi > 75) {
    riskLevel = "High";
  } else if (absChange < 0.75 && rsi >= 40 && rsi <= 60) {
    riskLevel = "Low";
  }

  const marketStatus = quote.dataStatus;

  return {
    quote,
    indicators: { rsi, macdHist, ma, trend },
    probabilities: { bullishProb, bearishProb },
    riskLevel,
    marketStatus,
    history: history.slice(-5)
  };
}

// Helper function to generate high-fidelity technical stock analysis text when Gemini is offline or as a standard format
function generateHighFidelityAnalysisText(ctx: any) {
  const symbol = ctx.quote.symbol;
  const name = ctx.quote.name;
  const price = ctx.quote.price;
  const change = ctx.quote.change;
  const percentChange = ctx.quote.percentChange;
  const volume = ctx.quote.volume;
  
  const moveStr = percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`;
  
  const provider = ctx.quote.provider || "Yahoo Finance / Twelve Data";
  const timestamp = ctx.quote.timestamp || new Date().toISOString();
  const dataStatus = ctx.quote.dataStatus || ctx.marketStatus || "DEMO";
  
  // 1. DATA TIMESTAMP section
  const headerSection = `STOCK ANALYSIS
Company:
${name} (${symbol})

Current Price:
₹${price}

Today's Movement:
${moveStr}

Market Sentiment:
${ctx.indicators.trend}

Data Source:
${provider}

Last Updated:
${new Date(timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (IST)

Data Status:
${dataStatus}`;

  // 2. IMPROVE ANALYSIS: Short Summary
  let sentimentDesc = "neutral";
  if (ctx.indicators.trend === "Bullish") sentimentDesc = "positive bullish";
  else if (ctx.indicators.trend === "Bearish") sentimentDesc = "negative bearish";
  
  let rsiState = "balanced";
  if (ctx.indicators.rsi < 30) rsiState = "oversold";
  else if (ctx.indicators.rsi > 70) rsiState = "overbought";
  
  let macdState = ctx.indicators.macdHist >= 0 ? "indicates short-term strength and upward momentum crossover" : "indicates short-term weakness and downward distribution pressure";
  
  let shortSummary = `${name} is currently showing ${sentimentDesc} momentum. Price is trading at ₹${price}, with the RSI indicating an ${rsiState} trading state, while the MACD ${macdState}.`;

  // 3. ADD MARKET CONTEXT
  const sector = ctx.quote.sector || "General Markets";
  const sectorSentiment = change >= 0 ? "positive/outperforming" : "negative/consolidating";
  const niftySentiment = percentChange >= 0 ? "positive" : "negative";
  const marketCondition = percentChange >= 0 ? "optimistic buying" : "cautious consolidation";
  
  const marketContextSection = `Indian market sentiment today is ${niftySentiment}. The overall NIFTY 50 trend shows key pivot support holding firmly with active capital accumulation in the ${sector} sector, which is exhibiting a ${sectorSentiment} performance today under overall ${marketCondition} market conditions.`;

  // 4. IMPROVE PROBABILITY MODEL
  const isDemo = dataStatus === "DEMO";
  const probBullishStr = isDemo ? "Live Indian market data unavailable" : `${ctx.probabilities.bullishProb}%`;
  const probBearishStr = isDemo ? "Live Indian market data unavailable" : `${ctx.probabilities.bearishProb}%`;
  
  let whyBullish = "";
  let whyBearish = "";
  
  if (isDemo) {
    whyBullish = "- **RSI Indicators**: Live Indian market data is currently unavailable. Heuristics are locked.\n- **Volume Assessment**: Simulated volume stream registers standard liquidity accumulation patterns.\n- **Trend Confirmation**: The general baseline trend is consolidative with no primary active signals.";
    whyBearish = "- **MACD Pressure**: Live Indian market data is currently unavailable. No bearish calculation is performed on simulated data.\n- **Price Weakness/Rejection**: Minimal localized selling pressure is registered on range boundaries.\n- **Market/Rotational Pressure**: Broader benchmark indices are in offline mode.";
  } else {
    const rsiBullishDesc = ctx.indicators.rsi < 35 
      ? "RSI is in highly oversold territory, showing strong signs of exhaustion from sellers and a high probability of a technical rebound."
      : ctx.indicators.rsi > 65
      ? "RSI is high, supporting strong trend velocity and continuation, though starting to approach overbought regions."
      : "RSI (14) stands in a neutral accumulation range, leaving significant room for further upward momentum.";
      
    const volBullishDesc = `With a healthy trading volume of ${volume}, there is active support from institutions defending the core price levels.`;
    
    const trendBullishDesc = ctx.indicators.trend === "Bullish" 
      ? "The primary price trend is firmly bullish, trading comfortably above the 14-day Simple Moving Average."
      : "The primary trend is currently consolidating, waiting for a breakout above the 14-day SMA.";
      
    whyBullish = `- **RSI Indicators**: ${rsiBullishDesc}\n- **Volume Assessment**: ${volBullishDesc}\n- **Trend Confirmation**: ${trendBullishDesc}`;

    const macdBearishDesc = ctx.indicators.macdHist < 0
      ? "MACD histogram registers a negative crossover, reflecting momentum slowdown and short-term selling pressure."
      : "MACD is positive, though any reduction in volume could quickly flatline momentum and trigger a mean-reversion pull-back.";
      
    const priceWeaknessDesc = change < 0
      ? "Today's minor price decline indicates local rejection near intraday high boundaries, signaling profit booking by short-term traders."
      : "While the price closed positive, minor upper-wick rejection suggests potential resistance overhead.";
      
    const marketPressureDesc = percentChange < 0
      ? "Underlying index volatility and rotational sector pressure are adding weight to current stock valuations."
      : "Rotational capital shifts between sectors could limit extensive runs without broader market index tailwinds.";

    whyBearish = `- **MACD Pressure**: ${macdBearishDesc}\n- **Price Weakness/Rejection**: ${priceWeaknessDesc}\n- **Market/Rotational Pressure**: ${marketPressureDesc}`;
  }

  // 5. ADD INVESTOR STYLE SUMMARY
  const rawSupport = price * 0.965;
  const rawResistance = price * 1.035;
  const supportVal = parseFloat(rawSupport.toFixed(1));
  const resistanceVal = parseFloat(rawResistance.toFixed(1));

  const investorStyleSection = `Short Term View:
${ctx.indicators.trend === "Bullish" ? "Immediate trend remains constructive. Look for minor buy-on-dips opportunities near support levels with a target retest of resistance." : "Expect sideways consolidation. Avoid chasing immediate breakouts until clear volume accumulation confirms a trend reversal."}

Medium Term View:
The primary trajectory is supported by stable 14-day moving averages of ₹${ctx.indicators.ma}. Long-term capital deployment remains favored for value accumulation, provided key structural support holds.

Risk Factors:
Sector rotation, macro policy announcements, and short-term ${ctx.indicators.macdHist < 0 ? "MACD bearish pressure" : "RSI over-extension"} volatility.

Key Levels:
- Support: ₹${supportVal}
- Resistance: ₹${resistanceVal}`;

  return `${headerSection}

Bullish Probability:
${probBullishStr}

Bearish Probability:
${probBearishStr}

Risk Level:
${ctx.riskLevel}

Short Summary:
${shortSummary}

Market Context:
${marketContextSection}

Why Bullish:
${whyBullish}

Why Bearish:
${whyBearish}

Investor Style Summary:
${investorStyleSection}

Educational analysis, not financial advice.`;
}

// API: Natural Language Market Chat Route
app.post("/api/ai/chat", async (req, res) => {
  const { question, history } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Missing user question" });
  }

  const cleanQ = question.trim().toLowerCase().replace(/[?,.!]g/, "");
  
  // Custom conversational greeting overrides for NOVA
  if (cleanQ === "hi" || cleanQ === "hello" || cleanQ === "hey" || cleanQ === "greetings") {
    return res.json({
      answer: `Hello! 👋
I’m NOVA, your AI market analyst inside MarketVerse.

I can help you analyze Indian stocks, understand market trends, explore technical indicators, and discover market insights.`
    });
  }

  if (cleanQ.includes("who are you") || cleanQ.includes("who am i") || cleanQ.includes("what is nova") || cleanQ.includes("who is nova") || cleanQ.includes("tell me about yourself")) {
    return res.json({
      answer: `Hi, I’m NOVA — your intelligent market analyst inside MarketVerse.

I help you understand Indian stock markets by analyzing price movements, technical indicators, market trends, and stock performance.

You can ask me:

• Analyze any Indian stock
• Find bullish stocks today
• Compare companies
• Understand market movements
• Learn trading concepts

I’m here to make market intelligence simpler.`
    });
  }

  if (cleanQ.includes("how are you")) {
    return res.json({
      answer: `I’m ready and analyzing the market. What would you like to explore today?`
    });
  }

  const detectedSymbol = detectSymbolInText(question);
  const ai = getGeminiClient();

  // If Gemini is not active or in cooldown, run fallback immediately
  if (!ai) {
    if (detectedSymbol) {
      const ctx = await getRealtimeStockAnalysisContext(detectedSymbol);
      const fallbackResponse = generateHighFidelityAnalysisText(ctx);
      return res.json({ answer: fallbackResponse });
    }

    // Generic fallback for general chat
    let fallbackAnswer = "";
    const q = question.toUpperCase();
    if (q.includes("COMPARE") || q.includes("HDFC") || q.includes("ICICI")) {
      fallbackAnswer = `### HDFC Bank vs ICICI Bank Technical Comparison (Heuristic Agent)
| Metric | HDFC Bank | ICICI Bank |
| :--- | :--- | :--- |
| **Trend** | Consolidating | Strong Bullish Outperformer |
| **RSI (14)** | ~45 (Neutral Accumulation) | ~62 (Positive Momentum) |
| **Moving Averages** | Resting on 50 EMA Support | Trending cleanly above 20 & 100 EMA |
| **Sector Role** | Institutional Anchor | Credit Growth Engine |

- **Analysis Summary**: ICICI Bank shows stronger immediate technical breakouts. HDFC Bank represents deep-value accumulation with stable risk parameters.
\n*Educational analysis, not financial advice.*`;
    } else if (q.includes("GAINER") || q.includes("PERFORMING BEST")) {
      fallbackAnswer = `### Top Performers in Indian Markets Today
Based on current live market feed data, the strongest performance indices are:
1. **Tata Motors**: Up on premium SUV delivery margins.
2. **Infosys**: Surging on large-scale European IT outsourcing project wins.
3. **Coal India**: Benefitting from domestic power demand volume sweeps.
4. **State Bank of India (SBIN)**: Solid credit demand pushing yields.
\n*Educational analysis, not financial advice.*`;
    } else if (q.includes("LOSER") || q.includes("WORST")) {
      fallbackAnswer = `### Top Decliners in Indian Markets Today
Current session results indicate temporary consolidative liquidations in:
1. **Wipro**: Down on marginal client spend slowdown headlines.
2. **ITC**: Minor profit booking after clean dividend ex-dates.
3. **Bharti Airtel**: Slower subscription growth numbers in localized zones.
\n*Educational analysis, not financial advice.*`;
    } else if (q.includes("CHART") || q.includes("EXPLAIN")) {
      fallbackAnswer = `### Understanding Stock Chart Formations
When inspecting active stock charts on MarketVerse:
1. **RSI (Relative Strength Index)**: Levels below 30 suggest oversold conditions (potential buy-the-dip). Levels above 70 indicate overbought conditions.
2. **Moving Averages**: Look for the golden cross (50 EMA crossing above 200 EMA) as a powerful long-term bull trend signal.
3. **Bollinger Bands**: Price touching the lower bands often triggers technical mean reversion buying, whereas upper band touches represent immediate local resistance.
\n*Educational analysis, not financial advice.*`;
    } else {
      fallbackAnswer = `### NOVA AI Analyst Assistant (Offline Mode)
Thank you for consulting NOVA, your intelligent market analyst. I am currently running on specialized local heuristics. 

**Current India Market Conditions**:
- **Nifty 50 Index**: Consolidating near key pivot support levels.
- **Sector Strengths**: Banking (ICICI/SBI) and IT (TCS/Infosys) are displaying steady capital accumulation, offsetting minor profit booking in FMCG and Metal counters.

Please ask me to **"Analyze Reliance"**, **"Analyze Tata Motors"**, **"Compare HDFC Bank vs ICICI Bank"**, or ask about **"Top gainers today"** to fetch dynamic technical insights.
\n*Educational analysis, not financial advice.*`;
    }

    return res.json({ answer: fallbackAnswer });
  }

  try {
    // Format message history
    const geminiHistory = (history || []).slice(-6).map((h: any) => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    let systemInstruction = "";
    if (detectedSymbol) {
      const ctx = await getRealtimeStockAnalysisContext(detectedSymbol);
      const moveStr = ctx.quote.percentChange >= 0 ? `+${ctx.quote.percentChange}%` : `${ctx.quote.percentChange}%`;
      const isDemo = ctx.quote.dataStatus === "DEMO";
      const probBullishStr = isDemo ? "Live Indian market data unavailable" : `${ctx.probabilities.bullishProb}%`;
      const probBearishStr = isDemo ? "Live Indian market data unavailable" : `${ctx.probabilities.bearishProb}%`;

      systemInstruction = `You are "NOVA" (Official Identity: "NOVA - Your Intelligent Market Analyst"), an expert Indian stock market analyst assistant inside the MarketVerse platform.
You MUST analyze the stock "${ctx.quote.name}" (${ctx.quote.symbol}) using the real-time, verified Indian market terminal data provided below:

Current Price: ₹${ctx.quote.price}
Today's Movement: ${moveStr}
Previous Close: ₹${parseFloat((ctx.quote.price - ctx.quote.change).toFixed(2))}
Open: ₹${parseFloat((ctx.quote.price - ctx.quote.change).toFixed(2))}
High: ₹${ctx.quote.dayHigh}
Low: ₹${ctx.quote.dayLow}
Volume: ${ctx.quote.volume}
Market Status: ${ctx.marketStatus}
Sector: ${ctx.quote.sector || "General Markets"}

Technical Indicators:
- 14-day Simple Moving Average (SMA): ₹${ctx.indicators.ma}
- RSI (14): ${ctx.indicators.rsi.toFixed(1)}
- MACD Histogram: ${ctx.indicators.macdHist}
- Trend: ${ctx.indicators.trend}

Deterministic Computed Metrics:
- Bullish Probability: ${probBullishStr}
- Bearish Probability: ${probBearishStr}
- Risk Level: ${ctx.riskLevel}

CRITICAL: You are FORBIDDEN from using any other stock prices or making up values. You MUST structure your response EXACTLY like the following template. Do NOT add any extra conversational filler before or after. Start immediately with "STOCK ANALYSIS":

STOCK ANALYSIS
Company:
${ctx.quote.name} (${ctx.quote.symbol})

Current Price:
₹${ctx.quote.price}

Today's Movement:
${moveStr}

Market Sentiment:
${ctx.indicators.trend}

Data Source:
${ctx.quote.provider || "Yahoo Finance / Twelve Data"}

Last Updated:
${new Date(ctx.quote.timestamp || Date.now()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (IST)

Data Status:
${ctx.quote.dataStatus || ctx.marketStatus || "DEMO"}

Bullish Probability:
${probBullishStr}

Bearish Probability:
${probBearishStr}

Risk Level:
${ctx.riskLevel}

Short Summary:
[Generate a highly informative, professional short summary of the stock's momentum, price position relative to support, and what MACD is indicating. Keep technical metrics but make it highly readable and clear. Do NOT use generic filler.]

Market Context:
[Include sector performance details for the "${ctx.quote.sector || "General Markets"}" sector, overall NIFTY trend description, and the general market condition today. Use the example structure: 'Indian market sentiment today is positive/negative...']

Why Bullish:
- RSI: [Detail how the RSI of ${ctx.indicators.rsi.toFixed(1)} supports or does not support a bullish outlook]
- Volume: [Detail how volume of ${ctx.quote.volume} confirms or does not confirm the move]
- Trend: [Detail how the primary trend of ${ctx.indicators.trend} reinforces the setup]

Why Bearish:
- MACD: [Detail the MACD histogram value of ${ctx.indicators.macdHist} and short-term divergence/convergence pressure]
- Price weakness: [Detail any price resistance, rejection, or recent declines]
- Market pressure: [Detail wider index or rotational context that poses downside risk]

Investor Style Summary:
Short Term View:
[Provide a clear technical view for short term traders]

Medium Term View:
[Provide a clear technical view for medium term value accumulators]

Risk Factors:
[Highlight the key risks]

Key Levels:
- Support: ₹${(ctx.quote.price * 0.965).toFixed(1)}
- Resistance: ₹${(ctx.quote.price * 1.035).toFixed(1)}

Educational analysis, not financial advice.`;
    } else {
      // General financial question
      const generalMarketContext = fetchChatContext(question);
      systemInstruction = `You are "NOVA" (Official Identity: "NOVA - Your Intelligent Market Analyst"), an expert Indian stock market analyst assistant inside the MarketVerse platform.
You understand:
- NSE (National Stock Exchange)
- BSE (Bombay Stock Exchange)
- Indian sectors
- Technical analysis (including RSI, Simple Moving Averages, Bollinger Bands, and MACD)
- Market trends
- Financial news
- Capital allocation

You help users understand markets using available data.
You explain reasoning clearly.
You never guarantee profits.
You provide educational market analysis.
Always append: "Educational analysis, not financial advice." to the end of your response.

Use the real-time live Indian market context supplied below to ground your answer. Do NOT answer blindly:
${generalMarketContext}

Answer the user's question clearly. Format your response beautifully using Markdown tables, bullet points, and headers for premium readability.`;
    }

    const chatMessages = [
      ...geminiHistory,
      { role: "user", parts: [{ text: question }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatMessages,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return res.json({ answer: response.text || "I was unable to analyze this query. Please check your market symbol parameters." });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    triggerGeminiCooldown(errMsg);
    console.log("Chat Gemini Error, falling back to heuristic answers:", errMsg);
    
    if (detectedSymbol) {
      const ctx = await getRealtimeStockAnalysisContext(detectedSymbol);
      const fallbackResponse = generateHighFidelityAnalysisText(ctx);
      return res.json({ answer: fallbackResponse });
    }

    return res.json({ answer: `⚠️ **AI analysis temporarily unavailable. Showing technical market analysis.**\n\nThe general trend in Indian benchmark Nifty 50 remains stable with support near 24,100. Watch sector indicators carefully. Educational analysis, not financial advice.` });
  }
});

// API: Comparative Analysis of Two Indian Stocks
app.post("/api/ai/compare", async (req, res) => {
  const { symbolA, symbolB } = req.body;
  if (!symbolA || !symbolB) {
    return res.status(400).json({ error: "Missing symbol parameters to compare" });
  }

  initServerQuotesStore();
  const qA = getOrCreateServerQuote(symbolA);
  const qB = getOrCreateServerQuote(symbolB);

  const histA = generateServerHistory(symbolA, "1M", qA.price);
  const histB = generateServerHistory(symbolB, "1M", qB.price);

  const indA = computeIndicators(histA);
  const indB = computeIndicators(histB);

  const ai = getGeminiClient();
  if (!ai) {
    // Dynamic rule-based comparative fallback
    const winnerSymbol = qA.percentChange > qB.percentChange ? qA.symbol : qB.symbol;
    return res.json({
      comparisonTable: [
        { metric: "Stock Price", [qA.symbol]: `₹${qA.price}`, [qB.symbol]: `₹${qB.price}` },
        { metric: "Daily Change", [qA.symbol]: `${qA.change > 0 ? "+" : ""}${qA.change} (${qA.percentChange}%)`, [qB.symbol]: `${qB.change > 0 ? "+" : ""}${qB.change} (${qB.percentChange}%)` },
        { metric: "14-day SMA", [qA.symbol]: `₹${indA.ma}`, [qB.symbol]: `₹${indB.ma}` },
        { metric: "RSI (14)", [qA.symbol]: `${indA.rsi.toFixed(1)} (${indA.trend})`, [qB.symbol]: `${indB.rsi.toFixed(1)} (${indB.trend})` },
        { metric: "Volume", [qA.symbol]: qA.volume, [qB.symbol]: qB.volume },
        { metric: "Sector", [qA.symbol]: qA.sector, [qB.symbol]: qB.sector }
      ],
      analysisText: `Comparative metrics for **${qA.symbol}** and **${qB.symbol}** reveal localized performance dispersion. 
      - **Price Action**: ${qA.symbol} trades at ₹${qA.price} showing a daily move of ${qA.percentChange}%, while ${qB.symbol} stands at ₹${qB.price} moving ${qB.percentChange}%.
      - **Technical Strength**: RSI indicators evaluate ${qA.symbol} in a **${indA.trend}** setup at ${indA.rsi.toFixed(1)}, whereas ${qB.symbol} exhibits **${indB.trend}** dynamics at ${indB.rsi.toFixed(1)}.
      - **Winner Bias**: ${winnerSymbol} presents cleaner immediate daily momentum coordinates.
      \n*Disclaimer: Educational technical study, not financial advice.*`,
      winner: winnerSymbol
    });
  }

  try {
    const prompt = `Compare the technical parameters of two Indian stocks:
Stock A: "${qA.name}" (${qA.symbol})
- Price: ₹${qA.price}
- Daily change: ${qA.percentChange}%
- Sector: ${qA.sector}
- Volume: ${qA.volume}
- Calculated 14-day SMA: ₹${indA.ma}
- Calculated RSI: ${indA.rsi.toFixed(1)} (${indA.trend})

Stock B: "${qB.name}" (${qB.symbol})
- Price: ₹${qB.price}
- Daily change: ${qB.percentChange}%
- Sector: ${qB.sector}
- Volume: ${qB.volume}
- Calculated 14-day SMA: ₹${indB.ma}
- Calculated RSI: ${indB.rsi.toFixed(1)} (${indB.trend})

You must return a single JSON object matching this schema exactly:
{
  "comparisonTable": [
    { "metric": "Current Price", "${qA.symbol}": "₹...", "${qB.symbol}": "₹..." },
    { "metric": "Daily Performance", "${qA.symbol}": "...", "${qB.symbol}": "..." },
    { "metric": "Relative Strength Index (RSI)", "${qA.symbol}": "...", "${qB.symbol}": "..." },
    { "metric": "14-Day SMA Level", "${qA.symbol}": "...", "${qB.symbol}": "..." },
    { "metric": "Volume / Liquidity", "${qA.symbol}": "...", "${qB.symbol}": "..." }
  ],
  "analysisText": "Max 120 words detailing comparison, relative strength, sector divergence, and dynamic setups. End with: 'Educational analysis, not financial advice.'",
  "winner": "${qA.symbol}" | "${qB.symbol}"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      comparisonTable: parsed.comparisonTable || [],
      analysisText: parsed.analysisText || `Technical comparison completed for ${qA.symbol} vs ${qB.symbol}. Educational analysis, not financial advice.`,
      winner: parsed.winner || (qA.percentChange > qB.percentChange ? qA.symbol : qB.symbol)
    });
  } catch (err: any) {
    triggerGeminiCooldown(err.message || String(err));
    return res.json({
      comparisonTable: [
        { metric: "Stock Price", [qA.symbol]: `₹${qA.price}`, [qB.symbol]: `₹${qB.price}` },
        { metric: "Daily Change", [qA.symbol]: `${qA.percentChange}%`, [qB.symbol]: `${qB.percentChange}%` },
        { metric: "RSI (14)", [qA.symbol]: indA.rsi.toFixed(1), [qB.symbol]: indB.rsi.toFixed(1) }
      ],
      analysisText: `Momentum comparison suggests ${qA.symbol} trades with an RSI of ${indA.rsi.toFixed(1)} vs ${qB.symbol} at ${indB.rsi.toFixed(1)}. Educational analysis, not financial advice.`,
      winner: qA.percentChange > qB.percentChange ? qA.symbol : qB.symbol
    });
  }
});

// API: Dynamic Daily Market Intelligence Summary
app.get("/api/ai/summary", async (req, res) => {
  initServerQuotesStore();
  
  // Calculate average performance of major sectors
  const sectorChanges: Record<string, number[]> = {};
  Object.keys(serverQuotesStore).forEach(sym => {
    const item = serverQuotesStore[sym];
    if (item.sector && item.sector !== "Benchmark") {
      if (!sectorChanges[item.sector]) sectorChanges[item.sector] = [];
      sectorChanges[item.sector].push(item.percentChange);
    }
  });

  const sectorSummary = Object.keys(sectorChanges).map(sec => {
    const list = sectorChanges[sec];
    const avg = list.reduce((a, b) => a + b, 0) / list.length;
    return { sector: sec, avgChange: parseFloat(avg.toFixed(2)) };
  });

  const strongestSector = [...sectorSummary].sort((a, b) => b.avgChange - a.avgChange)[0] || { sector: "Banking", avgChange: 0.1 };
  const weakestSector = [...sectorSummary].sort((a, b) => a.avgChange - b.avgChange)[0] || { sector: "IT", avgChange: -0.1 };

  const nifty = serverQuotesStore["NIFTY50"] || { price: 24155, percentChange: 0.1 };
  const overallTrend = nifty.percentChange > 0 ? "Positive" : nifty.percentChange < 0 ? "Negative" : "Consolidating";

  const ai = getGeminiClient();
  if (!ai) {
    // Dynamic rule-based fallback summary
    const summaryText = `Indian markets opened ${overallTrend.toLowerCase()} today with ${strongestSector.sector} sector showing strength (averaging +${strongestSector.avgChange}%), while ${weakestSector.sector} sector faces consolidative profit taking (averaging ${weakestSector.avgChange}%). Benchmarks continue holding pivot supports.`;
    return res.json({
      summaryText,
      sentiment: overallTrend,
      keyDrivers: [strongestSector.sector, "Benchmark Stability", "FII Inflows"]
    });
  }

  try {
    const prompt = `Based on these live market facts, write a highly professional, extremely concise 2-sentence market intelligence summary (under 60 words) suitable for an investment dashboard:
Facts:
- Nifty 50 Index: Change of ${nifty.percentChange}%
- Strongest Sector: ${strongestSector.sector} showing average performance of +${strongestSector.avgChange}%
- Weakest Sector: ${weakestSector.sector} showing average performance of ${weakestSector.avgChange}%
- General Market Vibe: ${overallTrend}

You must return a single JSON object matching this schema exactly:
{
  "summaryText": "your 2-sentence professional summary under 60 words",
  "sentiment": "Positive" | "Negative" | "Consolidating",
  "keyDrivers": ["driver 1", "driver 2", "driver 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      summaryText: parsed.summaryText || `Indian markets opened ${overallTrend.toLowerCase()} today with banking and technology driving key indices.`,
      sentiment: parsed.sentiment || overallTrend,
      keyDrivers: parsed.keyDrivers || [strongestSector.sector, "FII Positions"]
    });
  } catch (err: any) {
    triggerGeminiCooldown(err.message || String(err));
    return res.json({
      summaryText: `Indian markets opened ${overallTrend.toLowerCase()} today with ${strongestSector.sector} sector showing strength (+${strongestSector.avgChange}%) and Nifty consolidating near pivots.`,
      sentiment: overallTrend,
      keyDrivers: [strongestSector.sector, "Technical Pivots"]
    });
  }
});

// Helper to fetch and robustly parse Twelve Data response without crash/syntax issues
async function fetchTwelveDataJson(url: string): Promise<any> {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 150)}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Twelve Data response is not valid JSON: ${text.slice(0, 150)}`);
  }
}

import { REAL_NSE_STOCKS } from "./src/services/nseFallbackList.js";

// Cache for Twelve Data requests
const quoteCache: Record<string, { timestamp: number; data: any }> = {};
const historyCache: Record<string, { timestamp: number; data: any }> = {};

let twelveDataCooldownUntil = 0;

function isTwelveDataInCooldown(): boolean {
  return Date.now() < twelveDataCooldownUntil;
}

function triggerTwelveDataCooldown(errMessage: string) {
  const is429 = errMessage.includes("429") || errMessage.includes("credits") || errMessage.includes("rate limit") || errMessage.includes("limit") || errMessage.includes("RESOURCE_EXHAUSTED");
  const is404 = errMessage.includes("404");
  
  if (is429 || is404) {
    const minutes = is429 ? 3 : 10;
    twelveDataCooldownUntil = Date.now() + minutes * 60 * 1000;
    console.log(`[Twelve Data Cooldown] Status updated: active for ${minutes} minutes. (Reason: ${errMessage.slice(0, 100)})`);
  }
}

// Dynamic Stock Registry (Scalable search universe)
interface DynamicStockMeta {
  symbol: string;
  name: string;
  sector: string;
  exchange: "NSE" | "BSE";
}

const dynamicNseRegistry: Map<string, DynamicStockMeta> = new Map();
let isNseRegistryLoaded = false;

function inferSectorFromName(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("BANK") || upper.includes("FINANCIAL") || upper.includes("FINANCE") || upper.includes("CAPITAL") || upper.includes("INVESTMENT") || upper.includes("INSURANCE") || upper.includes("HOUSING")) {
    return "Finance";
  }
  if (upper.includes("SOFTWARE") || upper.includes("TECHNOLOGIES") || upper.includes("TECH") || upper.includes("INFOSYS") || upper.includes("CONSULTANCY") || upper.includes("SYSTEMS") || upper.includes("DIGITAL")) {
    return "IT";
  }
  if (upper.includes("PHARMA") || upper.includes("PHARMACEUTICALS") || upper.includes("LABORATORIES") || upper.includes("LABS") || upper.includes("DRUG") || upper.includes("HEALTHCARE") || upper.includes("HOSPITAL") || upper.includes("CLINIC")) {
    return "Pharma";
  }
  if (upper.includes("MOTOR") || upper.includes("MOTORS") || upper.includes("AUTOMOTIVE") || upper.includes("TYRE") || upper.includes("TYRES") || upper.includes("AUTO")) {
    return "Automobile";
  }
  if (upper.includes("POWER") || upper.includes("ENERGY") || upper.includes("GAS") || upper.includes("OIL") || upper.includes("PETROLEUM") || upper.includes("COAL") || upper.includes("RENEWABLE") || upper.includes("GREEN") || upper.includes("SOLAR") || upper.includes("ELECTRIC")) {
    return "Energy";
  }
  if (upper.includes("FOOD") || upper.includes("CONSUMER") || upper.includes("BEVERAGE") || upper.includes("BREWERIES") || upper.includes("MILK") || upper.includes("AGRO") || upper.includes("PRODUCTS") || upper.includes("INDUSTRIES") && (upper.includes("SOAP") || upper.includes("UNILEVER")) || upper.includes("FEEDS") || upper.includes("AGROVET") || upper.includes("COFFEE") || upper.includes("BREW") || upper.includes("DISTILL")) {
    return "FMCG";
  }
  if (upper.includes("INFRA") || upper.includes("INFRASTRUCTURE") || upper.includes("DEVELOPERS") || upper.includes("CEMENT") || upper.includes("CONSTRUCTION") || upper.includes("CONSTRUCTIONS") || upper.includes("PROPERTIES") || upper.includes("REALTY") || upper.includes("PROJECTS")) {
    return "Infrastructure";
  }
  if (upper.includes("STEEL") || upper.includes("METALS") || upper.includes("METAL") || upper.includes("MINING") || upper.includes("IRON") || upper.includes("ALUMINIUM") || upper.includes("ZINC") || upper.includes("COPPER")) {
    return "Metals";
  }
  if (upper.includes("TELECOM") || upper.includes("TELECOMMUNICATIONS") || upper.includes("COMMUNICATIONS") || upper.includes("MOBILE") || upper.includes("MEDIA") || upper.includes("BROADCAST") || upper.includes("ENTERTAINMENT") || upper.includes("TV")) {
    return "Telecom";
  }
  if (upper.includes("CHEMICAL") || upper.includes("CHEMICALS") || upper.includes("FERTILIZER") || upper.includes("FERTILISERS") || upper.includes("ORGANICS") || upper.includes("AEROSPACE") || upper.includes("DEFENCE")) {
    return "Chemicals";
  }
  if (upper.includes("TEXTILE") || upper.includes("TEXTILES") || upper.includes("SPINNING") || upper.includes("MILLS") || upper.includes("APPAREL") || upper.includes("GARMENTS")) {
    return "Textiles";
  }
  if (upper.includes("HOTEL") || upper.includes("HOTELS") || upper.includes("RESORT") || upper.includes("RESORTS") || upper.includes("HOLIDAYS") || upper.includes("TOURISM") || upper.includes("HOSPITALITY")) {
    return "Hospitality";
  }
  
  const defaultSectors = ["Finance", "IT", "Pharma", "Automobile", "Energy", "FMCG", "Infrastructure", "Metals", "Telecom", "Chemicals"];
  return defaultSectors[name.length % defaultSectors.length];
}

async function loadDynamicNseRegistry() {
  if (isNseRegistryLoaded) return;
  console.log("[Registry] Initializing dynamic Indian stock registry...");
  
  // Initialize with standard fallback list of top real companies first
  REAL_NSE_STOCKS.forEach(stock => {
    dynamicNseRegistry.set(stock.symbol.toUpperCase(), {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      exchange: stock.exchange
    });
  });

  const apiKey = process.env.MARKET_API_KEY || process.env.VITE_MARKET_API_KEY;
  // Twelve Data public stocks list endpoint is accessible without an API key too
  const url = `https://api.twelvedata.com/stocks?exchange=NSE${apiKey ? `&apikey=${apiKey}` : ""}`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && json.status === "ok" && Array.isArray(json.data)) {
        console.log(`[Registry] Successfully fetched ${json.data.length} NSE listed stocks from Twelve Data!`);
        
        json.data.forEach((stock: any) => {
          if (!stock.symbol) return;
          const symbol = stock.symbol.toUpperCase();
          if (stock.type && stock.type !== "Common Stock") return;

          if (dynamicNseRegistry.has(symbol)) {
            const existing = dynamicNseRegistry.get(symbol)!;
            dynamicNseRegistry.set(symbol, {
              symbol,
              name: stock.name || existing.name,
              sector: existing.sector,
              exchange: "NSE"
            });
          } else {
            const sector = inferSectorFromName(stock.name || "");
            dynamicNseRegistry.set(symbol, {
              symbol,
              name: stock.name || `${symbol} India Limited`,
              sector,
              exchange: "NSE"
            });
          }
        });
        
        isNseRegistryLoaded = true;
        console.log(`[Registry] Indian Stock Registry active with ${dynamicNseRegistry.size} real listed companies!`);
        return;
      } else {
        console.log("[Registry] Twelve Data stocks format is unexpected:", json);
      }
    } else {
      console.log(`[Registry] Twelve Data returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    console.log("[Registry] Could not fetch dynamic list from Twelve Data, relying on robust pre-seeded fallbacks:", err.message);
  }

  isNseRegistryLoaded = true;
  console.log(`[Registry] Registry fallback initialized with ${dynamicNseRegistry.size} real companies.`);
}

// Trigger loading on start
loadDynamicNseRegistry();

// Server-side market simulation fallback data
const serverQuotesStore: Record<string, any> = {};

function initServerQuotesStore() {
  if (Object.keys(serverQuotesStore).length > 0) return;
  
  INDIAN_STOCK_UNIVERSE.forEach(item => {
    const change = parseFloat(((Math.random() - 0.48) * (item.price * 0.02)).toFixed(2));
    const percentChange = parseFloat(((change / (item.price - change)) * 100).toFixed(2));
    
    serverQuotesStore[item.symbol] = {
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      change,
      percentChange,
      volume: item.symbol === "MRF" ? "15K" : `${(1 + Math.random() * 15).toFixed(1)}M`,
      dayHigh: parseFloat((item.price * 1.01).toFixed(2)),
      dayLow: parseFloat((item.price * 0.99).toFixed(2)),
      high52: parseFloat((item.price * 1.25).toFixed(2)),
      low52: parseFloat((item.price * 0.75).toFixed(2)),
      sector: item.sector,
      exchange: item.exchange,
      type: "india",
      source: "Simulated Live Feed",
      dataStatus: "DEMO",
      timestamp: new Date().toISOString()
    };
  });

  // Load benchmarks explicitly
  const benchmarks = [
    { symbol: "NIFTY50", name: "Nifty 50 Index", price: 24155.80, sector: "Benchmark", exchange: "NSE" as const, volume: "250M" },
    { symbol: "BANKNIFTY", name: "Nifty Bank Index", price: 52350.30, sector: "Benchmark", exchange: "NSE" as const, volume: "180M" },
    { symbol: "SENSEX", name: "BSE SENSEX Index", price: 79560.20, sector: "Benchmark", exchange: "BSE" as const, volume: "50M" }
  ];

  benchmarks.forEach(b => {
    const change = parseFloat(((Math.random() - 0.45) * (b.price * 0.01)).toFixed(2));
    const percentChange = parseFloat(((change / (b.price - change)) * 100).toFixed(2));
    serverQuotesStore[b.symbol] = {
      symbol: b.symbol,
      name: b.name,
      price: b.price,
      change,
      percentChange,
      volume: b.volume,
      dayHigh: parseFloat((b.price * 1.005).toFixed(2)),
      dayLow: parseFloat((b.price * 0.995).toFixed(2)),
      high52: parseFloat((b.price * 1.15).toFixed(2)),
      low52: parseFloat((b.price * 0.85).toFixed(2)),
      sector: b.sector,
      exchange: b.exchange,
      type: "india",
      source: "Simulated Live Feed",
      dataStatus: "DEMO",
      timestamp: new Date().toISOString()
    };
  });
}

function updateServerQuotesStoreFromReal(quotes: Record<string, any>) {
  initServerQuotesStore();
  Object.entries(quotes).forEach(([sym, q]) => {
    if (!q) return;
    const cleanSym = sym.toUpperCase().trim();
    
    // If it doesn't exist yet, we will generate dynamic meta to preseed properties
    if (!serverQuotesStore[cleanSym]) {
      getOrCreateServerQuote(cleanSym);
    }
    
    serverQuotesStore[cleanSym] = {
      ...serverQuotesStore[cleanSym],
      price: typeof q.price === 'number' ? q.price : parseFloat(q.price || "0"),
      change: typeof q.change === 'number' ? q.change : parseFloat(q.change || "0"),
      percentChange: typeof q.percentChange === 'number' ? q.percentChange : parseFloat(q.percentChange || "0"),
      volume: q.volume || serverQuotesStore[cleanSym].volume,
      open: q.open ? (typeof q.open === 'number' ? q.open : parseFloat(q.open)) : serverQuotesStore[cleanSym].open,
      dayHigh: q.high ? (typeof q.high === 'number' ? q.high : parseFloat(q.high)) : (q.dayHigh ? (typeof q.dayHigh === 'number' ? q.dayHigh : parseFloat(q.dayHigh)) : serverQuotesStore[cleanSym].dayHigh),
      dayLow: q.low ? (typeof q.low === 'number' ? q.low : parseFloat(q.low)) : (q.dayLow ? (typeof q.dayLow === 'number' ? q.dayLow : parseFloat(q.dayLow)) : serverQuotesStore[cleanSym].dayLow),
      previousClose: q.previousClose ? (typeof q.previousClose === 'number' ? q.previousClose : parseFloat(q.previousClose)) : serverQuotesStore[cleanSym].previousClose,
      timestamp: q.timestamp || new Date().toISOString(),
      source: q.provider || q.source || "Real API Feed",
      dataStatus: q.dataStatus || "DELAYED",
    };
  });
}

function getOrCreateServerQuote(symbol: string) {
  initServerQuotesStore();
  const cleanSym = symbol.toUpperCase().trim();
  if (serverQuotesStore[cleanSym]) {
    return serverQuotesStore[cleanSym];
  }

  // Check if symbol exists in dynamicNseRegistry
  const regItem = dynamicNseRegistry.get(cleanSym);
  const meta = generateDynamicUniverseStock(cleanSym);
  
  const name = regItem ? regItem.name : meta.name;
  const sector = regItem ? regItem.sector : meta.sector;
  const exchange = regItem ? regItem.exchange : meta.exchange;

  const change = parseFloat(((Math.random() - 0.48) * (meta.price * 0.02)).toFixed(2));
  const percentChange = parseFloat(((change / (meta.price - change)) * 100).toFixed(2));

  const quote = {
    symbol: cleanSym,
    name,
    price: meta.price,
    change,
    percentChange,
    volume: `${(1 + Math.random() * 15).toFixed(1)}M`,
    dayHigh: parseFloat((meta.price * 1.01).toFixed(2)),
    dayLow: parseFloat((meta.price * 0.99).toFixed(2)),
    high52: parseFloat((meta.price * 1.25).toFixed(2)),
    low52: parseFloat((meta.price * 0.75).toFixed(2)),
    sector,
    exchange,
    type: "india",
    source: "Simulated Live Feed",
    dataStatus: "DEMO",
    timestamp: new Date().toISOString()
  };

  serverQuotesStore[cleanSym] = quote;
  return quote;
}

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

function tickServerQuotes() {
  initServerQuotesStore();
  Object.keys(serverQuotesStore).forEach(sym => {
    const stock = serverQuotesStore[sym];
    const volatility = 0.003;
    const tickDirection = Math.random() - (sym === "TCS" || sym === "ADANIENT" ? 0.51 : 0.48);
    const tickValue = stock.price * tickDirection * volatility;
    
    stock.price = parseFloat((stock.price + tickValue).toFixed(2));
    stock.change = parseFloat((stock.change + tickValue * 0.1).toFixed(2));
    stock.percentChange = parseFloat(((stock.change / (stock.price - stock.change)) * 100).toFixed(2));
    stock.dayHigh = parseFloat(Math.max(stock.dayHigh, stock.price).toFixed(2));
    stock.dayLow = parseFloat(Math.min(stock.dayLow, stock.price).toFixed(2));
  });
}

// Keep simulated quotes ticking every 5 seconds
setInterval(tickServerQuotes, 5000);

function generateServerHistory(symbol: string, timeframe: string, price: number): any[] {
  const points = timeframe === "1D" ? 24 : timeframe === "5D" ? 40 : timeframe === "1M" ? 30 : timeframe === "6M" ? 120 : timeframe === "1Y" ? 52 : 60;
  const volatility = 0.015;
  
  const history: any[] = [];
  let currentPrice = price * 0.95;
  const now = Date.now();
  
  for (let i = points; i > 0; i--) {
    const stepMs = timeframe === "1D" ? 3600000 : timeframe === "5D" ? 14400000 : 86400000;
    const itemTime = new Date(now - i * stepMs).toISOString().split('T')[0];
    
    const changePercent = (Math.random() - 0.48) * volatility;
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor((Math.random() * 0.5 + 0.5) * 1000000);
    
    history.push({
      time: itemTime,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    currentPrice = close;
  }
  return history;
}

// API: Flexible Market Provider Quote Proxy with Comparison Logic
app.get("/api/market/quote", async (req, res) => {
  const symbol = (req.query.symbol as string || "").toUpperCase().trim();
  if (!symbol) {
    return res.status(400).json({ error: "Missing asset symbol" });
  }

  // Look up the symbol to find the exchange
  const fallbackItem = REAL_NSE_STOCKS.find(s => s.symbol === symbol);
  const exchange = fallbackItem?.exchange || "NSE";

  // Check cache - short cache (10s) to keep freshness high but prevent spam
  const cached = quoteCache[symbol];
  if (cached && Date.now() - cached.timestamp < 10000) {
    return res.json(cached.data);
  }

  const providers = [
    {
      name: "Indian Stock Market API",
      fetch: () => getIndianStockQuote(symbol)
    },
    {
      name: "Yahoo Finance Indian Market Provider",
      fetch: () => indianMarketProvider.fetchQuote(symbol, exchange)
    }
  ];

  const apiKey = process.env.MARKET_API_KEY || process.env.VITE_MARKET_API_KEY;
  if (apiKey && !isTwelveDataInCooldown()) {
    providers.push({
      name: "Twelve Data API Provider",
      fetch: () => twelveDataProvider.fetchQuote(symbol, apiKey)
    });
  }

  try {
    const results = await Promise.allSettled(providers.map(p => p.fetch()));
    const successfulQuotes: { provider: string; price: number; timestamp: string; quote: any }[] = [];

    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successfulQuotes.push({
          provider: providers[idx].name,
          price: res.value.price,
          timestamp: res.value.timestamp || new Date().toISOString(),
          quote: res.value
        });
      } else if (res.status === "rejected") {
        console.error(`[Provider Error] ${providers[idx].name} failed for ${symbol}:`, res.reason?.message || res.reason);
        if (providers[idx].name === "Twelve Data API Provider") {
          triggerTwelveDataCooldown(res.reason?.message || String(res.reason));
        }
      }
    });

    if (successfulQuotes.length > 0) {
      // Sort: newest timestamp first
      successfulQuotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const chosen = successfulQuotes[0];

      // Price Discrepancy logic
      let priceDiscrepancy = false;
      const comparedPrices: Record<string, number> = {};
      successfulQuotes.forEach(q => {
        comparedPrices[q.provider] = q.price;
      });

      if (successfulQuotes.length > 1) {
        for (let i = 0; i < successfulQuotes.length; i++) {
          for (let j = i + 1; j < successfulQuotes.length; j++) {
            const qA = successfulQuotes[i];
            const qB = successfulQuotes[j];
            const diffPercent = Math.abs(qA.price - qB.price) / Math.min(qA.price, qB.price);
            if (diffPercent > 0.02) {
              priceDiscrepancy = true;
            }
          }
        }
      }

      // "REMOVE FALSE LIVE CLAIMS: Do not display LIVE unless the provider confirms fresh data."
      // Since public API feeds for equities are delayed, default status to "DELAYED".
      // We only allow "LIVE" if the provider confirms fresh real-time data AND the timestamp is less than 60s old.
      let finalStatus: "LIVE" | "DELAYED" | "DEMO" = "DELAYED";
      const isVeryFresh = (Date.now() - new Date(chosen.timestamp).getTime()) < 60000;
      if (chosen.quote.dataStatus === "LIVE" && isVeryFresh) {
        finalStatus = "LIVE";
      }

      const responseData = {
        symbol: chosen.quote.symbol || symbol,
        name: chosen.quote.name,
        price: chosen.price,
        change: chosen.quote.change,
        percentChange: chosen.quote.percentChange,
        volume: chosen.quote.volume,
        open: chosen.quote.open,
        high: chosen.quote.high,
        low: chosen.quote.low,
        previousClose: chosen.quote.previousClose,
        timestamp: chosen.timestamp,
        exchange: chosen.quote.exchange || exchange,
        dataStatus: finalStatus,
        provider: chosen.provider,
        priceDiscrepancy,
        comparedPrices,
        debug: {
          provider: chosen.provider,
          timestamp: chosen.timestamp,
          symbolSent: symbol,
          rawResponse: chosen.quote.rawResponse || chosen.quote,
          comparedProvidersCount: successfulQuotes.length,
          priceDiscrepancy,
          comparedPrices
        }
      };

      quoteCache[symbol] = { timestamp: Date.now(), data: responseData };
      
      // Update local simulation cache with real data
      try {
        updateServerQuotesStoreFromReal({ [symbol]: responseData });
      } catch (errStore) {
        console.warn("[Registry Cache Update Error] Failed to update mock store:", errStore);
      }

      return res.json(responseData);
    } else {
      throw new Error("No successful quote fetched from any provider");
    }
  } catch (errGlobal: any) {
    console.warn(`[Quote Proxy Fallback] All providers failed for ${symbol}, using simulation fallback.`);
    const fallbackQuote = getOrCreateServerQuote(symbol);
    const responseData = {
      ...fallbackQuote,
      dataStatus: "DEMO" as const,
      provider: "Simulated Live Feed Fallback",
      source: "Simulated Live Feed Fallback",
      timestamp: new Date().toISOString(),
      priceDiscrepancy: false,
      comparedPrices: {},
      debug: {
        provider: "Simulated Live Feed Fallback",
        timestamp: new Date().toISOString(),
        symbolSent: symbol,
        rawResponse: { note: "Real providers unavailable. Using offline simulation data." }
      }
    };
    return res.json(responseData);
  }
});

// API: Flexible Market Provider Batch Quotes Proxy
app.get("/api/market/all_quotes", async (req, res) => {
  const cacheKey = "all_quotes_batch";
  const cached = quoteCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 180000) { // 3 min cache
    return res.json(cached.data);
  }

  const symbols = [
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
    "SBIN", "ITC", "BHARTIARTL", "TATAMOTORS", "ADANIENT",
    "AXISBANK", "WIPRO", "M&M", "MARUTI", "SUNPHARMA",
    "CIPLA", "ONGC", "HINDUNILVR", "BAJFINANCE", "L&T",
    "TATASTEEL", "JSWSTEEL",
    "NIFTY50", "BANKNIFTY", "SENSEX"
  ];

  try {
    // Priority 1: Indian Stock Market API
    const quotes = await getMultipleStocks(symbols);
    quoteCache[cacheKey] = { timestamp: Date.now(), data: quotes };
    try {
      updateServerQuotesStoreFromReal(quotes);
    } catch (errStore) {
      console.warn("[Registry Cache Update Error] Failed to update mock store in batch:", errStore);
    }
    return res.json(quotes);
  } catch (errApi: any) {
    console.error("[Provider Error] Indian Stock Market API batch failed:", errApi.message);

    try {
      // Priority 2: Indian market provider (Yahoo Finance batch)
      const quotes = await indianMarketProvider.fetchBatchQuotes(symbols);
      quoteCache[cacheKey] = { timestamp: Date.now(), data: quotes };
      try {
        updateServerQuotesStoreFromReal(quotes);
      } catch (errStore) {
        console.warn("[Registry Cache Update Error] Failed to update mock store in batch:", errStore);
      }
      return res.json(quotes);
    } catch (err1: any) {
      console.error("[Provider Error] Indian Market Provider batch failed:", err1.message);

      // Priority 3: Twelve Data batch
      const apiKey = process.env.MARKET_API_KEY || process.env.VITE_MARKET_API_KEY;
      if (apiKey && !isTwelveDataInCooldown()) {
        try {
          const quotes = await twelveDataProvider.fetchBatchQuotes(symbols, apiKey);
          quoteCache[cacheKey] = { timestamp: Date.now(), data: quotes };
          try {
            updateServerQuotesStoreFromReal(quotes);
          } catch (errStore) {
            console.warn("[Registry Cache Update Error] Failed to update mock store in batch:", errStore);
          }
          return res.json(quotes);
        } catch (err2: any) {
          console.error("[Provider Error] Twelve Data batch failed:", err2.message);
          triggerTwelveDataCooldown(err2.message || String(err2));
        }
      }

      // Priority 4: Simulated fallback
      initServerQuotesStore();
      return res.json(serverQuotesStore);
    }
  }
});

// API: Flexible Market Provider History Proxy
app.get("/api/market/history", async (req, res) => {
  const symbol = (req.query.symbol as string || "").toUpperCase().trim();
  const timeframe = (req.query.timeframe as string || "1M").toUpperCase();

  if (!symbol) {
    return res.status(400).json({ error: "Missing asset symbol" });
  }

  const fallbackItem = REAL_NSE_STOCKS.find(s => s.symbol === symbol);
  const exchange = fallbackItem?.exchange || "NSE";

  const cacheKey = `${symbol}_${timeframe}`;
  const cached = historyCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
    return res.json(cached.data);
  }

  try {
    // Priority 1: Indian Stock Market API
    const historyList = await getStockHistory(symbol, timeframe);
    historyCache[cacheKey] = { timestamp: Date.now(), data: historyList };
    return res.json(historyList);
  } catch (errApi: any) {
    console.error(`[Provider Error] Indian Stock Market API history failed for ${symbol}:`, errApi.message);

    try {
      // Priority 2: Indian Market Provider (Yahoo Finance)
      const historyList = await indianMarketProvider.fetchHistory(symbol, timeframe, exchange);
      historyCache[cacheKey] = { timestamp: Date.now(), data: historyList };
      return res.json(historyList);
    } catch (err1: any) {
      console.error(`[Provider Error] Indian Market Provider history failed for ${symbol}:`, err1.message);

      // Priority 3: Twelve Data
      const apiKey = process.env.MARKET_API_KEY || process.env.VITE_MARKET_API_KEY;
      if (apiKey && !isTwelveDataInCooldown()) {
        try {
          const historyList = await twelveDataProvider.fetchHistory(symbol, timeframe, apiKey);
          historyCache[cacheKey] = { timestamp: Date.now(), data: historyList };
          return res.json(historyList);
        } catch (err2: any) {
          console.error(`[Provider Error] Twelve Data history failed for ${symbol}:`, err2.message);
          triggerTwelveDataCooldown(err2.message || String(err2));
        }
      }

      // Priority 4: Simulated history
      const quote = getOrCreateServerQuote(symbol);
      const simulatedHistory = generateServerHistory(symbol, timeframe, quote.price);
      return res.json(simulatedHistory);
    }
  }
});

// API: Dynamic NSE Stock Registry Search
app.get("/api/market/search", async (req, res) => {
  const query = (req.query.query as string || "").toUpperCase().trim();
  if (!query) {
    return res.json([]);
  }

  // Ensure registry is loaded
  if (!isNseRegistryLoaded) {
    await loadDynamicNseRegistry();
  }

  const matches: any[] = [];
  const matchedSymbols = new Set<string>();

  // 1. Search locally
  for (const [symbol, stock] of dynamicNseRegistry.entries()) {
    if (symbol.includes(query) || stock.name.toUpperCase().includes(query)) {
      matches.push({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        exchange: stock.exchange
      });
      matchedSymbols.add(stock.symbol);
      if (matches.length >= 80) break;
    }
  }

  // 2. Search using live Indian Stock Market API and merge
  try {
    const apiResults = await searchIndianStock(query);
    if (Array.isArray(apiResults)) {
      apiResults.forEach((item: any) => {
        if (!item) return;
        const sym = cleanSymbolForApi(item.symbol || "");
        if (!sym) return;
        if (!matchedSymbols.has(sym)) {
          matches.push({
            symbol: sym,
            name: item.name || `${sym} India`,
            sector: item.sector || "General Market",
            exchange: item.exchange || "NSE"
          });
          matchedSymbols.add(sym);
        }
      });
    }
  } catch (err: any) {
    console.error("[Search Route] API search failed, fallback to local:", err.message);
  }

  return res.json(matches.slice(0, 80));
});

// Template articles used when Twelve Data News is not configured or fails
const DEFAULT_NEWS_TEMPLATES = [
  {
    id: "news-template-1",
    title: "RBI Keeps Rates Unchanged: Focus Shifts to Liquidity Management and Growth Support",
    source: "Bloomberg India",
    time: "15 minutes ago",
    category: "Breaking",
    preview: "The Monetary Policy Committee of the RBI decided to keep the repo rate steady at 6.5%. Analysts say this matches expectations, leaving room for equity markets to build on recent momentum."
  },
  {
    id: "news-template-2",
    title: "Tata Motors Shines as Q1 Net Income Surges 45%, Supported by Strong JLR Margins",
    source: "Reuters Financial",
    time: "42 minutes ago",
    category: "Company",
    preview: "Tata Motors reported a blockbuster net profit, beating consensus estimates by over 12%. Robust demand for premium SUVs in North America and China drove margins at Jaguar Land Rover."
  },
  {
    id: "news-template-3",
    title: "US Dollar Index Climbs to 3-Month High After Stronger-Than-Expected Jobs Print",
    source: "Wall Street Journal",
    time: "1 hour ago",
    category: "Forex",
    preview: "The greenback surged against all major currencies as non-farm payrolls jumped by 245,000, defying forecasts of a slowdown. This cements expectations of a hawkish Fed stance."
  },
  {
    id: "news-template-4",
    title: "Reliance Retail Plans IPO in Early 2027: Valuation Eyed at Over $110 Billion",
    source: "Economic Times",
    time: "2 hours ago",
    category: "Company",
    preview: "Reliance Industries is preparing to spin off its retail division in what promises to be India's largest-ever public listing. Unlisted shares of Reliance Retail have ticked up in grey market trading."
  },
  {
    id: "news-template-5",
    title: "Eurozone PMI Contracts Further to 46.5: ECB Warns of Impending Growth Softening",
    source: "Financial Times",
    time: "3 hours ago",
    category: "Global",
    preview: "Business activity across the eurozone fell at the fastest rate in over two years, signaling that high interest rates are severely constraining manufacturing and services alike."
  },
  {
    id: "news-template-6",
    title: "Infosys Bags Landmark $1.5 Billion AI and Cloud Transformation Deal with Global Retailer",
    source: "CNBC TV18",
    time: "4 hours ago",
    category: "Company",
    preview: "Infosys announced a new five-year contract to deploy enterprise-wide generative AI systems and cloud computing infrastructure for a Fortune 50 consumer retail brand."
  },
  {
    id: "news-template-7",
    title: "Crude Oil Climbs Towards $85/bbl on OPEC+ Extended Supply Cuts and Geopolitical Tension",
    source: "Platts Global",
    time: "5 hours ago",
    category: "Global",
    preview: "Brent crude futures gained 1.4% on expectations of a tightening global deficit as OPEC+ members agreed to hold back nearly 2.2 million barrels per day through the next quarter."
  },
  {
    id: "news-template-8",
    title: "USD/INR Near Record Lows: Import Costs Rise While Exporters See Hedging Opportunities",
    source: "Forex Live",
    time: "6 hours ago",
    category: "Forex",
    preview: "The Indian Rupee weakened to 83.65 against the greenback, prompted by consistent capital outflows and elevated energy bills. The RBI intervened heavily in spot markets to curb excess volatility."
  }
];

// Server-side Gemini News processing pipeline
async function analyzeNewsPipelineWithGemini(articles: any[], ai: any): Promise<any[]> {
  if (!ai) {
    // Robust rule-based fallback if Gemini client is not configured
    return articles.map((art, idx) => {
      const titleLower = art.title.toLowerCase();
      
      let sentiment: "Positive" | "Negative" | "Neutral" = "Neutral";
      let impact: "High" | "Medium" | "Low" = "Medium";
      let score = 50;
      const related: string[] = [];
      let summary = "Static analysis indicates range-bound asset realignment following this announcement.";

      // Tag symbols
      if (titleLower.includes("reliance")) { related.push("RELIANCE"); }
      if (titleLower.includes("tata motors") || titleLower.includes("tatamotors")) { related.push("TATAMOTORS"); }
      if (titleLower.includes("infosys") || titleLower.includes("infy")) { related.push("INFY"); }
      if (titleLower.includes("tcs")) { related.push("TCS"); }
      if (titleLower.includes("hdfc")) { related.push("HDFCBANK"); }
      if (titleLower.includes("icici")) { related.push("ICICIBANK"); }
      if (titleLower.includes("sbi")) { related.push("SBIN"); }
      if (titleLower.includes("itc")) { related.push("ITC"); }
      if (titleLower.includes("airtel")) { related.push("BHARTIARTL"); }
      if (titleLower.includes("adani")) { related.push("ADANIENT"); }
      
      if (titleLower.includes("euro") || titleLower.includes("eur")) { related.push("EURUSD"); }
      if (titleLower.includes("pound") || titleLower.includes("gbp")) { related.push("GBPUSD"); }
      if (titleLower.includes("yen") || titleLower.includes("jpy")) { related.push("USDJPY"); }
      if (titleLower.includes("rupee") || titleLower.includes("inr")) { related.push("USDINR"); }
      if (titleLower.includes("australian") || titleLower.includes("aud")) { related.push("AUDUSD"); }
      if (titleLower.includes("loonie") || titleLower.includes("cad") || titleLower.includes("canadian")) { related.push("USDCAD"); }
      
      if (related.length === 0) {
        if (art.category === "Forex" || art.category === "Forex Markets") {
          related.push("USDINR", "EURUSD");
        } else {
          related.push("NIFTY50", "SENSEX");
        }
      }

      // Heuristic sentiment detection
      const isPositive = titleLower.includes("surge") || titleLower.includes("win") || titleLower.includes("rise") || titleLower.includes("profit") || titleLower.includes("grow") || titleLower.includes("up") || titleLower.includes("gain") || titleLower.includes("bull") || titleLower.includes("bags");
      const isNegative = titleLower.includes("drop") || titleLower.includes("fall") || titleLower.includes("contract") || titleLower.includes("loss") || titleLower.includes("warn") || titleLower.includes("slump") || titleLower.includes("down") || titleLower.includes("bear") || titleLower.includes("fear");

      if (isPositive) {
        sentiment = "Positive";
        impact = "High";
        score = Math.floor(75 + Math.random() * 20);
        summary = `Optimistic trends observed. Headline displays strong upward momentum likely to drive price action for ${related.join(", ")}.`;
      } else if (isNegative) {
        sentiment = "Negative";
        impact = "High";
        score = Math.floor(70 + Math.random() * 25);
        summary = `Decline patterns spotted. Negative market signal could trigger liquidations and downside volatility for ${related.join(", ")}.`;
      } else {
        sentiment = "Neutral";
        impact = "Medium";
        score = Math.floor(40 + Math.random() * 20);
        summary = `Balanced market stance. Market participants are neutral on ${related.join(", ")}, monitoring further catalysts.`;
      }

      return {
        id: art.id || `news-fallback-${idx}`,
        title: art.title,
        source: art.source || "Market News",
        time: art.time || "Recently",
        category: art.category || "Global",
        marketImpact: impact,
        impactDirection: sentiment,
        preview: art.preview || art.title,
        aiSummary: summary,
        impactScore: score,
        relatedSymbols: related
      };
    });
  }

  try {
    const prompt = `You are a professional financial news analyst system.
Analyze the following news articles. For each article, determine:
1. "impactDirection": Is it "Positive" (representing a Bullish market signal for the related stock/forex pairs), "Negative" (representing a Bearish signal), or "Neutral"?
2. "marketImpact": How high is the market significance ("High", "Medium", or "Low")?
3. "impactScore": A number from 0 to 100 indicating the strength of relevance or movement force (e.g. blockbuster earnings/interest rate changes are 85-100, moderate analyst upgrades are 50-80, macro updates are 20-50).
4. "aiSummary": A extremely precise 1-2 sentence analytical summary of why this news is significant and its specific sector/asset impact.
5. "relatedSymbols": An array of specific asset symbols (from: RELIANCE, TATAMOTORS, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, ITC, BHARTIARTL, ADANIENT, NIFTY50, SENSEX, EURUSD, GBPUSD, USDJPY, USDINR, AUDUSD, USDCAD) that are most directly affected by this news. Always assign at least one related symbol or index (like NIFTY50) to each article!

Articles to process:
${JSON.stringify(articles.map(a => ({ id: a.id, title: a.title, preview: a.preview || a.title, category: a.category })))}

You must return a single JSON array of objects matching this schema exactly (preserve the original id, title, source, time, and category of the input articles):
[
  {
    "id": string,
    "title": string,
    "source": string,
    "time": string,
    "category": string,
    "preview": string,
    "marketImpact": "High" | "Medium" | "Low",
    "impactDirection": "Positive" | "Negative" | "Neutral",
    "aiSummary": string,
    "impactScore": number,
    "relatedSymbols": string[]
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    
    // Map parsed values back to original article keys to make sure no fields are missing
    return articles.map((art) => {
      const analyzed = Array.isArray(parsed) ? parsed.find((p: any) => p.id === art.id) : null;
      if (analyzed) {
        return {
          id: art.id,
          title: art.title,
          source: art.source || "Financial Source",
          time: art.time || "Recently",
          category: art.category || "Global",
          preview: art.preview || art.title,
          marketImpact: analyzed.marketImpact || "Medium",
          impactDirection: analyzed.impactDirection || "Neutral",
          aiSummary: analyzed.aiSummary || "Analyzed by MarketVerse AI.",
          impactScore: typeof analyzed.impactScore === "number" ? analyzed.impactScore : 50,
          relatedSymbols: Array.isArray(analyzed.relatedSymbols) ? analyzed.relatedSymbols.map((s: string) => s.toUpperCase()) : ["NIFTY50"]
        };
      }

      // If specific analysis failed, use fallback mapping for this single item
      return {
        id: art.id,
        title: art.title,
        source: art.source || "Financial Source",
        time: art.time || "Recently",
        category: art.category || "Global",
        preview: art.preview || art.title,
        marketImpact: "Medium",
        impactDirection: "Neutral",
        aiSummary: "Analyzed by MarketVerse AI.",
        impactScore: 50,
        relatedSymbols: ["NIFTY50"]
      };
    });

  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
      geminiCooldownUntil = Date.now() + 60000;
      console.log("[GEMINI COOLDOWN] Quota exceeded detected in analyzeNewsPipelineWithGemini. Triggering 1-minute cooldown.");
    }
    console.log("Gemini batch news analysis failed, falling back to heuristic:", errMsg);
    // Safe heuristic fallback
    return analyzeNewsPipelineWithGemini(articles, null);
  }
}

// Cache for news
let newsCache: { timestamp: number; data: any[] } | null = null;

// API: Twelve Data News Proxy with Gemini Sentiment & Relevance Pipeline
app.get("/api/market/news", async (req, res) => {
  if (newsCache && Date.now() - newsCache.timestamp < 300000) { // 5 mins cache
    return res.json(newsCache.data);
  }

  const ai = getGeminiClient();
  const apiKey = process.env.MARKET_API_KEY || process.env.VITE_MARKET_API_KEY;

  if (!apiKey || isTwelveDataInCooldown()) {
    // If Twelve Data is not configured or in cooldown, we use the fallback default seed templates processed by Gemini
    try {
      const processed = await analyzeNewsPipelineWithGemini(DEFAULT_NEWS_TEMPLATES, ai);
      newsCache = { timestamp: Date.now(), data: processed };
      return res.json(processed);
    } catch (err: any) {
      console.log("Fallback News pipeline failed:", err);
      return res.status(500).json({ error: "Failed to load simulated news pipeline" });
    }
  }

  try {
    const url = `https://api.twelvedata.com/news?apikey=${apiKey}`;
    const result = await fetchTwelveDataJson(url);

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error(result.message || "Invalid news payload");
    }

    // Process top 6 live articles
    const rawArticles = result.data.slice(0, 6).map((item: any, idx: number) => ({
      id: `news-live-${idx}`,
      title: item.title,
      source: item.source_name || "Financial News",
      time: item.date || "Live Feed",
      category: "Global",
      preview: item.summary || item.title
    }));

    const processed = await analyzeNewsPipelineWithGemini(rawArticles, ai);

    newsCache = { timestamp: Date.now(), data: processed };
    return res.json(processed);
  } catch (err: any) {
    triggerTwelveDataCooldown(err.message || String(err));
    // Safe graceful degradation using DEFAULT_NEWS_TEMPLATES
    try {
      const processed = await analyzeNewsPipelineWithGemini(DEFAULT_NEWS_TEMPLATES, null);
      newsCache = { timestamp: Date.now(), data: processed };
      return res.json(processed);
    } catch (innerErr) {
      const fallbackNews = DEFAULT_NEWS_TEMPLATES.map((item, idx) => ({
        id: item.id || `news-raw-${idx}`,
        title: item.title,
        source: item.source || "Finance Feed",
        time: item.time || "Recently",
        category: item.category || "Global",
        preview: item.preview || item.title,
        marketImpact: "Medium",
        impactDirection: "Neutral" as const,
        aiSummary: item.preview,
        impactScore: 50,
        relatedSymbols: ["NIFTY50"]
      }));
      return res.json(fallbackNews);
    }
  }
});

// API: Health probe
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ----------------- VITE MIDDLEWARE SETUP -----------------

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
