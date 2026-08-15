import { callGeminiDirectly } from "./marketVerseAI";

export interface AIAnalysisResult {
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  risk: "Low" | "Medium" | "High";
  riskPercentage: number;
  safetyScore: number;
  briefNote: string;
  strategyExplanation: string;
  reasons?: string[];
  possibleScenarios?: {
    shortTerm: string;
    mediumTerm: string;
  };
  keyIndicators?: {
    rsi: number;
    macd: string;
    movingAverages: string;
    trend: string;
  };
  isDemo?: boolean;
}

export const aiApi = {
  isLive(): boolean {
    return true; // Proxy backend handles status dynamically
  },

  async analyzeStock(symbol: string, price: number, history: any[]): Promise<AIAnalysisResult> {
    try {
      const response = await fetch("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, price })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          sentiment: data.sentiment || "Neutral",
          confidence: data.confidence || 75,
          risk: data.risk || "Medium",
          riskPercentage: data.riskPercentage || 45,
          safetyScore: data.safetyScore || 65,
          briefNote: data.briefNote || (symbol + " is in structured technical balance."),
          strategyExplanation: data.strategyExplanation,
          reasons: data.reasons,
          possibleScenarios: data.possibleScenarios,
          keyIndicators: data.keyIndicators,
          isDemo: false
        };
      }
      throw new Error("Server /api/ai/analyze-stock returned status " + response.status);
    } catch (e) {
      console.error("AI API Error (aiApi.analyzeStock, falling back to direct client call):", e);
      
      const apiKey = 
        import.meta.env.VITE_GEMINI_API_KEY || 
        import.meta.env.GEMINI_API_KEY || 
        import.meta.env.VITE_AI_API_KEY ||
        "";

      if (!apiKey) {
        throw new Error(
          "⚠️ **Gemini API Key Missing:** Please add `VITE_GEMINI_API_KEY=your_key_here` to your `.env` file and restart the Vite dev server (`npm run dev`)."
        );
      }

      console.log("Using direct client-side Gemini fallback for analyzeStock...");
      try {
        const systemPrompt = "You are a premium institutional stock market analyst. You must analyze the stock " + symbol + " and return a JSON object ONLY matching this schema:\n" +
          "{\n" +
          "  \"sentiment\": \"Bullish\" | \"Bearish\" | \"Neutral\",\n" +
          "  \"confidence\": number (1-100),\n" +
          "  \"risk\": \"Low\" | \"Medium\" | \"High\",\n" +
          "  \"riskPercentage\": number (1-100),\n" +
          "  \"safetyScore\": number (1-100),\n" +
          "  \"briefNote\": \"brief analysis summary\",\n" +
          "  \"strategyExplanation\": \"detailed strategy and analysis\",\n" +
          "  \"reasons\": [\"reason 1\", \"reason 2\"],\n" +
          "  \"possibleScenarios\": {\n" +
          "    \"shortTerm\": \"short term view\",\n" +
          "    \"mediumTerm\": \"medium term view\"\n" +
          "  },\n" +
          "  \"keyIndicators\": {\n" +
          "    \"rsi\": number,\n" +
          "    \"macd\": \"MACD description\",\n" +
          "    \"movingAverages\": \"MA description\",\n" +
          "    \"trend\": \"Bullish\" | \"Bearish\" | \"Neutral\"\n" +
          "  }\n" +
          "}\n" +
          "Do not write any markdown fences, prefix, or suffix - return raw valid JSON.";

        const lastElement = history[history.length - 1];
        const rsi = lastElement?.rsi || 50;
        const contextPrompt = "Current price: ₹" + price + ", RSI: " + rsi.toFixed(1) + ".\nAnalyze " + symbol + " technically.";

        const rawResult = await callGeminiDirectly(contextPrompt, [], systemPrompt);
        const cleanedJsonStr = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedJsonStr);
        
        return {
          sentiment: data.sentiment || "Neutral",
          confidence: data.confidence || 75,
          risk: data.risk || "Medium",
          riskPercentage: data.riskPercentage || 45,
          safetyScore: data.safetyScore || 65,
          briefNote: data.briefNote || (symbol + " is in structured technical balance."),
          strategyExplanation: data.strategyExplanation,
          reasons: data.reasons,
          possibleScenarios: data.possibleScenarios,
          keyIndicators: data.keyIndicators,
          isDemo: false
        };
      } catch (directErr: any) {
        console.error("Direct Gemini API Client-Side Fallback Error (aiApi.analyzeStock):", directErr);
        throw directErr;
      }
    }
  }
};
