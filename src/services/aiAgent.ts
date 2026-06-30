// MarketVerse AI Stock Market Intelligence Agent Service (Client Wrapper)

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
    const response = await fetch("/api/ai/analyze-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol })
    });
    if (!response.ok) {
      throw new Error("Failed to analyze stock with MarketVerse AI");
    }
    return response.json();
  },

  /**
   * Natural language chat assistant (ChatGPT-like) connected to real-time market contexts.
   */
  async answerMarketQuestion(question: string, history: { role: "user" | "model"; text: string }[] = []): Promise<string> {
    const response = await fetch("/api/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history })
    });
    if (!response.ok) {
      const altResponse = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history })
      });
      if (!altResponse.ok) {
        throw new Error("Failed to consult MarketVerse AI");
      }
      const data = await altResponse.json();
      return data.answer;
    }
    const data = await response.json();
    return data.answer;
  },

  /**
   * Comprehensive comparative analysis of two Indian stocks with technical parameters.
   */
  async compareStocks(symbolA: string, symbolB: string): Promise<ComparisonResponse> {
    const response = await fetch("/api/ai/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbolA, symbolB })
    });
    if (!response.ok) {
      throw new Error("Failed to compare stocks with MarketVerse AI");
    }
    return response.json();
  },

  /**
   * Retrieves today's high-intelligence dynamic market summary.
   */
  async getMarketSummary(): Promise<MarketSummaryResponse> {
    const response = await fetch("/api/ai/summary");
    if (!response.ok) {
      throw new Error("Failed to retrieve dynamic market intelligence summary");
    }
    return response.json();
  }
};
