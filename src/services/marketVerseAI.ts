// MarketVerse AI - Premium Indian Stock Market Intelligence Agent (Client Service)
import { robustFetchJson } from "../utils/apiUtils";

export interface AIAnalysisResponse {
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  risk: "Low" | "Medium" | "High";
  riskPercentage: number;
  safetyScore: number;
  briefNote: string;
  strategyExplanation: string;
  reasons: string[];
  possibleScenarios: {
    shortTerm: string;
    mediumTerm: string;
  };
  keyIndicators: {
    rsi: number;
    macd: string;
    movingAverages: string;
    trend: string;
  };
}

export const marketVerseAI = {
  /**
   * Complete natural language chat with conversation memory support.
   */
  async chatWithMarketAI(question: string, history: { role: "user" | "model"; text: string }[] = []): Promise<string> {
    try {
      const data = await robustFetchJson<{ answer: string }>("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
        timeoutMs: 15000,
        retries: 1
      });
      return data.answer;
    } catch (error) {
      console.error("Failed to communicate with MarketVerse AI Agent", error);
      throw new Error("Failed to communicate with MarketVerse AI Agent");
    }
  },

  /**
   * Detailed technical and sentiment review of an Indian stock symbol.
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
      console.error(`Failed to run AI analysis for ${symbol}`, error);
      throw new Error(`Failed to run AI analysis for ${symbol}`);
    }
  },

  /**
   * Direct prompt queries to the Indian market analyst model.
   */
  async marketQuestion(question: string): Promise<string> {
    return this.chatWithMarketAI(question, []);
  }
};
