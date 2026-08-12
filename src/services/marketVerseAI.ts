// MarketVerse AI - Premium Indian Stock Market Intelligence Agent (Client Service)

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
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history })
    });
    if (!response.ok) {
      throw new Error("Failed to communicate with MarketVerse AI Agent");
    }
    const data = await response.json();
    return data.answer;
  },

  /**
   * Detailed technical and sentiment review of an Indian stock symbol.
   */
  async analyzeStock(symbol: string): Promise<AIAnalysisResponse> {
    const response = await fetch("/api/ai/analyze-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol })
    });
    if (!response.ok) {
      throw new Error(`Failed to run AI analysis for ${symbol}`);
    }
    return response.json();
  },

  /**
   * Direct prompt queries to the Indian market analyst model.
   */
  async marketQuestion(question: string): Promise<string> {
    return this.chatWithMarketAI(question, []);
  }
};
