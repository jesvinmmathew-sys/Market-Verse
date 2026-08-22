/**
 * ============================================================================
 * MARKETVERSE INDIA - NOVA AI INTELLIGENT TRADE COPILOT
 * ============================================================================
 * 1. Primary: Secure Server-side API (/api/chat) with fallback to local SDK.
 * 2. Secondary: Complete Dynamic Knowledge Base (Zero-Crash Fallback Engine).
 * ============================================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";

const NOVA_SYSTEM_PROMPT = `You are Nova AI, the institutional financial intelligence and trade copilot for MarketVerse India.
- MarketVerse is an all-in-one financial intelligence and paper-trading terminal for Indian equities (NSE/BSE).
- Key Capabilities:
  1. Real-time TradingView technical charting.
  2. Zero-risk simulated execution with a virtual ₹10,00,000 wallet and live virtual P&L.
  3. Quantitative portfolio risk diagnostics using Modern Portfolio Theory and Herfindahl-Hirschman Index (HHI) concentration auditing.
  4. Scenario Generation: Objective Bull/Bear trade setups with disciplined stop-loss levels.
- Guidelines:
  - If the user asks about Nova AI, MarketVerse, or how you can help them, provide a clear, bulleted overview of your capabilities.
  - If asked about stocks, provide structured Bull/Bear analysis with support and resistance levels.
  - If asked about finance or risk concepts (HHI, RSI, beta), provide concise, institutional-grade explanations.`;

let genAI: GoogleGenerativeAI | null = null;
let liveModel: any = null;

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (or gemini-2.0-flash) for current generation stability
    liveModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: NOVA_SYSTEM_PROMPT,
    });
  } catch (err) {
    console.warn("[Nova AI] Live API initialization notice:", err);
  }
}

const knownStocks = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "TATAMOTORS", "SBIN", "ITC", "BHARTIARTL", "NIFTY"];

// Ensure stock responses return dedicated structured analysis data without fallback greeting strings
export function formatStockAnalysisResponse(symbol: string, stockData: any, aiThesis?: string) {
  const defaultNotes = `• Key Momentum: Consolidating near key pivot zones with balanced institutional volume.\n` +
    `• Strategy: Watch for a breakout above ₹${(stockData.price * 1.015).toFixed(2)} with disciplined risk management.`;

  return {
    type: 'STOCK_CARD',
    symbol: symbol.toUpperCase(),
    companyName: stockData.name || `${symbol.toUpperCase()} Ltd`,
    price: stockData.price,
    change: stockData.change || 0,
    changePercent: stockData.changePercent || 0,
    open: stockData.open || stockData.price,
    high: stockData.high || stockData.price * 1.01,
    low: stockData.low || stockData.price * 0.99,
    volume: stockData.volume || '1.2M',
    bullishProb: stockData.bullishProb || 65,
    bearishProb: stockData.bearishProb || 35,
    riskProfile: stockData.riskProfile || 'MEDIUM RISK',
    volatilityIndex: stockData.volatilityIndex || 45,
    support: (stockData.price * 0.985).toFixed(2),
    resistance: (stockData.price * 1.025).toFixed(2),
    analystNotes: aiThesis && aiThesis.trim().length > 0 ? aiThesis : defaultNotes,
    // Do NOT include the generic "Hello! I am Nova AI" greeting text here
    textMessage: null
  };
}

/**
 * Main query handler: Attempts live secure server-side API, fallback to SDK, and then local fallback
 */
export async function askNovaAI(
  userQuery: string,
  stockContext?: { symbol?: string; price?: number }
): Promise<string> {
  const query = (userQuery || "").trim();
  const lower = query.toLowerCase();

  // --------------------------------------------------------------------------
  // 1. SECURE SERVER-SIDE REST API INFERENCE
  // --------------------------------------------------------------------------
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, context: stockContext })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.reply && data.reply.trim().length > 0) {
        // If a stock is matched, format as a STOCK_CARD directly
        const matched = knownStocks.find((s) => lower.includes(s.toLowerCase()));
        if (matched) {
          const quoteResponse = await fetch(`/api/market/quote?symbol=${matched}`).catch(() => null);
          const quoteData = quoteResponse && quoteResponse.ok ? await quoteResponse.json().catch(() => null) : null;
          const stockData = {
            name: quoteData?.name || `${matched} India`,
            price: quoteData?.price || 1500,
            change: quoteData?.change || 0,
            changePercent: quoteData?.percentChange || 0,
            volume: quoteData?.volume || "1.2M",
            open: quoteData?.open,
            high: quoteData?.dayHigh,
            low: quoteData?.dayLow,
          };
          return JSON.stringify(formatStockAnalysisResponse(matched, stockData, data.reply));
        }
        return data.reply;
      }
    }
  } catch (serverErr) {
    console.warn("[Nova AI] Secure Server-side chat failed, attempting client-side SDK:", serverErr);
  }

  // --------------------------------------------------------------------------
  // 2. CLIENT-SIDE GEMINI API INFERENCE (SDK FALLBACK)
  // --------------------------------------------------------------------------
  if (liveModel && GEMINI_API_KEY) {
    try {
      const result = await liveModel.generateContent(query);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        // If a stock is matched, format as a STOCK_CARD directly
        const matched = knownStocks.find((s) => lower.includes(s.toLowerCase()));
        if (matched) {
          const quoteResponse = await fetch(`/api/market/quote?symbol=${matched}`).catch(() => null);
          const quoteData = quoteResponse && quoteResponse.ok ? await quoteResponse.json().catch(() => null) : null;
          const stockData = {
            name: quoteData?.name || `${matched} India`,
            price: quoteData?.price || 1500,
            change: quoteData?.change || 0,
            changePercent: quoteData?.percentChange || 0,
            volume: quoteData?.volume || "1.2M",
            open: quoteData?.open,
            high: quoteData?.dayHigh,
            low: quoteData?.dayLow,
          };
          return JSON.stringify(formatStockAnalysisResponse(matched, stockData, text));
        }
        return text;
      }
    } catch (apiError) {
      console.warn("[Nova AI] Live API failed, using local intelligence engine:", apiError);
    }
  }

  // --------------------------------------------------------------------------
  // 3. CONTEXTUAL LOCAL KNOWLEDGE BASE (NEVER CRASHES)
  // --------------------------------------------------------------------------

  // A. Creator / Founders / Team
  if (lower.includes("who is the creator") || lower.includes("who made") || lower.includes("who built") || lower.includes("founder") || lower.includes("creator of marketverse")) {
    return (
      "**MarketVerse India** was engineered as an institutional-grade financial intelligence and paper-trading terminal for Indian equity markets.\n\n" +
      "It was built to solve the retail trading crisis in India by providing a zero-risk flight simulator combining live TradingView charting, Modern Portfolio Theory risk auditing (HHI), and Nova AI trade intelligence."
    );
  }

  // B. News & Market Sentiment Engine
  if (lower.includes("news") || lower.includes("sentiment") || lower.includes("catalyst") || lower.includes("how does news work")) {
    return (
      "**MarketVerse News & Sentiment Engine:**\n\n" +
      "• **Real-Time Ingestion**: Aggregates breaking corporate filings, quarterly earnings, and regulatory disclosures across NSE/BSE.\n" +
      "• **NLP Sentiment Scoring**: Tags market headlines as **Bullish**, **Bearish**, or **Neutral** using language analysis.\n" +
      "• **Contextual Impact**: Evaluates how sector-wide events affect specific stock support and resistance levels."
    );
  }

  // C. Portfolio Health & Risk Analyzer
  if (lower.includes("portfolio") || lower.includes("analyzer") || lower.includes("hhi") || lower.includes("risk engine") || lower.includes("how does portfolio work")) {
    return (
      "**MarketVerse Portfolio Health Analyzer:**\n\n" +
      "• **HHI Concentration Index**: Calculates the Herfindahl-Hirschman Index to detect single-stock overexposure and sector imbalances.\n" +
      "• **Sector Stress Testing**: Simulates portfolio resilience against sector drawdowns and market corrections.\n" +
      "• **Asset Allocation Benchmarking**: Compares your holdings against optimal diversification standards to protect capital."
    );
  }

  // D. Paper Trading Terminal & Execution
  if (lower.includes("paper trading") || lower.includes("simulator") || lower.includes("virtual wallet") || lower.includes("how to trade")) {
    return (
      "**Simulated Paper Trading Terminal:**\n\n" +
      "• **Virtual ₹10,00,000 Wallet**: Practice order execution with zero financial risk.\n" +
      "• **Live Order Simulation**: Supports Market and Limit orders matched against real-time NSE/BSE price feeds.\n" +
      "• **Performance Tracking**: Live virtual P&L, win/loss ratios, and maximum drawdown metrics."
    );
  }

  // E. Capabilities & Assistance Overview
  if (
    lower.includes("nova") ||
    lower.includes("how can you help") ||
    lower.includes("how do you help") ||
    lower.includes("who are you") ||
    lower.includes("what can you do") ||
    lower.includes("features")
  ) {
    return (
      "I am **Nova AI**, the intelligent trade copilot embedded inside MarketVerse India.\n\n" +
      "**Here is how I can help you:**\n" +
      "• **Trade Thesis Generation**: Analyze any NSE/BSE stock for Bull & Bear setups, key support/resistance zones, and momentum profiles.\n" +
      "• **Portfolio Risk Auditing**: Measure your portfolio's Herfindahl-Hirschman Index (HHI) concentration score and identify single-stock overexposure.\n" +
      "• **Simulated Strategy Testing**: Test trading setups inside our simulated ₹10,00,000 paper trading terminal with zero financial risk.\n" +
      "• **Market Concept Breakdown**: Explain technical indicators (RSI, MACD, Volume Profile) and fundamental valuation metrics."
    );
  }

  // F. General Platform Overview
  if (
    lower.includes("marketverse") ||
    lower.includes("market verse") ||
    lower.includes("platform") ||
    lower.includes("website") ||
    lower.includes("about you") ||
    lower.includes("about platform") ||
    lower.includes("what is this")
  ) {
    return (
      "**MarketVerse India** is a next-generation financial intelligence and paper-trading terminal designed for Indian equity markets.\n\n" +
      "**Core Modules:**\n" +
      "1. **Institutional Charting**: Advanced TradingView charts with technical overlays.\n" +
      "2. **Simulated Paper Trading**: Zero-risk trading cockpit with a virtual ₹10,00,000 wallet.\n" +
      "3. **Portfolio Risk Engine**: Real-time HHI concentration audits and sector stress testing.\n" +
      "4. **Nova AI Copilot**: Context-aware trade thesis and market sentiment analysis."
    );
  }

  // G. Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon)\b/i.test(lower)) {
    return (
      "Hello! I am **Nova AI**, your MarketVerse trade copilot.\n\n" +
      "You can ask me to:\n" +
      "• Analyze any NSE stock (e.g., *'Analyze RELIANCE'* or *'Is TCS bullish?'*)\n" +
      "• Audit portfolio risk metrics (e.g., *'Explain HHI concentration score'*)\n" +
      "• Review simulated paper trading setups."
    );
  }

  // H. Quantitative Risk & Indicators
  if (lower.includes("hhi") || lower.includes("concentration") || lower.includes("diversification")) {
    return (
      "**Herfindahl-Hirschman Index (HHI)** is a quantitative metric used by MarketVerse to assess portfolio concentration risk:\n\n" +
      "• **HHI < 1,500**: Well-diversified asset allocation.\n" +
      "• **HHI 1,500 – 2,500**: Moderate concentration risk.\n" +
      "• **HHI > 2,500**: High concentration alert — vulnerability to single-stock volatility."
    );
  }

  if (lower.includes("rsi") || lower.includes("relative strength")) {
    return (
      "**RSI (Relative Strength Index)** measures price momentum on a scale of 0 to 100:\n\n" +
      "• **RSI > 70**: Overbought territory (watch for potential consolidation).\n" +
      "• **RSI < 30**: Oversold territory (potential accumulation or bounce).\n" +
      "• **Divergence**: Price making lower lows while RSI makes higher lows suggests bullish reversal momentum."
    );
  }

  // I. Specific Stock Analysis (Only triggered when explicit stock name is mentioned)
  const matched = knownStocks.find((s) => lower.includes(s.toLowerCase()));
  if (matched) {
    const symbol = matched;
    let price = stockContext?.price || (symbol === "NIFTY" ? 24500 : 2850);
    const mockChange = parseFloat(((Math.random() - 0.45) * 12).toFixed(2));
    const mockPercent = parseFloat(((mockChange / price) * 100).toFixed(2));
    const stockData = {
      name: `${symbol} India`,
      price: price,
      change: mockChange,
      changePercent: mockPercent,
      volume: "1.2M",
      open: price - mockChange,
      high: price * 1.012,
      low: price * 0.988,
    };
    
    const localThesis = 
      `• **Bull Scenario**: Solid support base near ₹${(price * 0.985).toFixed(2)} with positive RSI divergence.\n` +
      `• **Bear Scenario**: Immediate resistance near ₹${(price * 1.018).toFixed(2)}; monitor volume on pullbacks.\n` +
      `• **Risk-Reward Profile**: Favorable 1:2.4 risk-to-reward ratio for swing setups with a strict 1.5% stop-loss.`;
      
    return JSON.stringify(formatStockAnalysisResponse(symbol, stockData, localThesis));
  }

  return (
    `Hello! I am **Nova AI**. You can ask me to analyze any NSE/BSE equity (e.g., *'Analyze RELIANCE'*), audit portfolio concentration with HHI, or explain technical indicators.`
  );
}
