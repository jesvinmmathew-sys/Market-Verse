// MarketVerse AI Stock Market Intelligence Agent Service (Client Wrapper)
import { robustFetchJson } from "../utils/apiUtils";

export interface AIAnalysisResponse {
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  risk: "Low" | "Medium" | "High";
  riskPercentage: number;
  safetyScore: number;
  briefNote: string;
  strategyExplanation: string;
  possibleScenarios?: {
    shortTerm: string;
    mediumTerm: string;
  };
  reasons?: string[];
  keyIndicators?: {
    rsi: number;
    macd: string;
    movingAverages: string;
    trend: string;
  };
}

export interface ComparisonResponse {
  comparisonTable: {
    metric: string;
    [key: string]: string | number;
  }[];
  analysisText: string;
  winner: string;
}

export interface MarketSummaryResponse {
  summaryText: string;
  sentiment: "Positive" | "Negative" | "Consolidating";
  keyDrivers: string[];
}

export const aiAgent = {
  /**
   * Complete, professional analysis of a single Indian stock.
   * Feeds on live price, indicators, trend, news, and sector context.
   */
  async analyzeStock(symbol: string): Promise<AIAnalysisResponse> {
    try {
      return await robustFetchJson<AIAnalysisResponse>("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
        timeoutMs: 15000,
        retries: 1
      });
    } catch (error) {
      console.error("Failed to analyze stock with MarketVerse AI", error);
      throw new Error("Failed to analyze stock with MarketVerse AI");
    }
  },

  /**
   * Natural language chat assistant (ChatGPT-like) connected to real-time market contexts.
   */
  async answerMarketQuestion(question: string, history: { role: "user" | "model"; text: string }[] = []): Promise<string> {
    try {
      // First try /api/api/ai/chat, as in the original logic, or just fallback immediately
      return (await robustFetchJson<{ answer: string }>("/api/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
        timeoutMs: 15000,
        retries: 0
      })).answer;
    } catch (e) {
      try {
        return (await robustFetchJson<{ answer: string }>("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, history }),
          timeoutMs: 15000,
          retries: 1
        })).answer;
      } catch (error) {
        console.error("Failed to consult MarketVerse AI", error);
        throw new Error("Failed to consult MarketVerse AI");
      }
    }
  },

  /**
   * Comprehensive comparative analysis of two Indian stocks with technical parameters.
   */
  async compareStocks(symbolA: string, symbolB: string): Promise<ComparisonResponse> {
    try {
      return await robustFetchJson<ComparisonResponse>("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbolA, symbolB }),
        timeoutMs: 15000,
        retries: 1
      });
    } catch (error) {
      console.error("Failed to compare stocks with MarketVerse AI", error);
      throw new Error("Failed to compare stocks with MarketVerse AI");
    }
  },

  /**
   * Retrieves today's high-intelligence dynamic market summary.
   */
  async getMarketSummary(): Promise<MarketSummaryResponse> {
    try {
      return await robustFetchJson<MarketSummaryResponse>("/api/ai/summary", {
        timeoutMs: 15000,
        retries: 1,
        cacheTtlMs: 30000 // cache for 30s
      });
    } catch (error) {
      console.error("Failed to retrieve dynamic market intelligence summary", error);
      throw new Error("Failed to retrieve dynamic market intelligence summary");
    }
  }
};
