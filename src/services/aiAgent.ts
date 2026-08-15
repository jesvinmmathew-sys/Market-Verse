// MarketVerse AI Stock Market Intelligence Agent Service (Client Wrapper)
import { marketVerseAI, callGeminiDirectly } from "./marketVerseAI";

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
    return marketVerseAI.analyzeStock(symbol);
  },

  /**
   * Natural language chat assistant (ChatGPT-like) connected to real-time market contexts.
   */
  async answerMarketQuestion(question: string, history: { role: "user" | "model"; text: string }[] = []): Promise<string> {
    return marketVerseAI.chatWithMarketAI(question, history);
  },

  /**
   * Comprehensive comparative analysis of two Indian stocks with technical parameters.
   */
  async compareStocks(symbolA: string, symbolB: string): Promise<ComparisonResponse> {
    try {
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbolA, symbolB })
      });
      if (response.ok) {
        return response.json();
      }
      throw new Error("Server /api/ai/compare returned status " + response.status);
    } catch (error) {
      console.error("AI API Error (compareStocks for " + symbolA + " vs " + symbolB + "):", error);
      
      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
        console.log("Using direct client-side Gemini fallback for comparing " + symbolA + " and " + symbolB + "...");
        try {
          const systemPrompt = "You are a premium institutional stock market analyst. Compare " + symbolA + " and " + symbolB + " technically, and return a JSON object ONLY matching this schema:\n" +
            "{\n" +
            "  \"comparisonTable\": [\n" +
            "    { \"metric\": \"RSI (14)\", \"symbolA_value\": \"e.g. 55\", \"symbolB_value\": \"e.g. 45\" },\n" +
            "    { \"metric\": \"Price Action\", \"symbolA_value\": \"e.g. Bullish\", \"symbolB_value\": \"e.g. Consolidating\" }\n" +
            "  ],\n" +
            "  \"analysisText\": \"detailed comparative analysis paragraph\",\n" +
            "  \"winner\": \"" + symbolA + "\" | \"" + symbolB + "\" | \"Neutral\"\n" +
            "}\n" +
            "Do not write any markdown fences, prefix, or suffix - return raw valid JSON.";

          const prompt = "Compare technical parameters, trend, and outlook for " + symbolA + " vs " + symbolB + ".";
          const rawResult = await callGeminiDirectly(prompt, [], systemPrompt);
          
          const cleanedJsonStr = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleanedJsonStr);
        } catch (directErr) {
          console.error("Direct Gemini API Client-Side Fallback Error (compareStocks):", directErr);
          throw directErr;
        }
      }
      throw error;
    }
  },

  /**
   * Retrieves today's high-intelligence dynamic market summary.
   */
  async getMarketSummary(): Promise<MarketSummaryResponse> {
    try {
      const response = await fetch("/api/ai/summary");
      if (response.ok) {
        return response.json();
      }
      throw new Error("Server /api/ai/summary returned status " + response.status);
    } catch (error) {
      console.error("AI API Error (getMarketSummary):", error);
      
      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
        console.log("Using direct client-side Gemini fallback for market summary...");
        try {
          const systemPrompt = "You are a premium institutional stock market analyst. Return a JSON object ONLY matching this schema:\n" +
            "{\n" +
            "  \"summaryText\": \"detailed market outlook summary\",\n" +
            "  \"sentiment\": \"Positive\" | \"Negative\" | \"Consolidating\",\n" +
            "  \"keyDrivers\": [\"driver 1\", \"driver 2\"]\n" +
            "}\n" +
            "Do not write any markdown fences, prefix, or suffix - return raw valid JSON.";

          const prompt = "Provide a summary of the current Indian stock market indices, Nifty 50 trend, and news drivers.";
          const rawResult = await callGeminiDirectly(prompt, [], systemPrompt);
          
          const cleanedJsonStr = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleanedJsonStr);
        } catch (directErr) {
          console.error("Direct Gemini API Client-Side Fallback Error (getMarketSummary):", directErr);
          throw directErr;
        }
      }
      throw error;
    }
  }
};
