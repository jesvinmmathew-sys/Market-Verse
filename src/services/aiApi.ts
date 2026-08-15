import { callGeminiDirectly, generateLocalInstitutionalAnalysis } from "./marketVerseAI";

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
      
      try {
        const systemPrompt = "You are a premium senior quantitative stock market analyst specializing in the Indian Stock Market. You must analyze the stock " + symbol + " and return a JSON object ONLY matching this schema:\n" +
          "{\n" +
          "  \"sentiment\": \"Bullish\" | \"Bearish\" | \"Neutral\",\n" +
          "  \"confidence\": number (1-100),\n" +
          "  \"risk\": \"Low\" | \"Medium\" | \"High\",\n" +
          "  \"riskPercentage\": number (1-100),\n" +
          "  \"safetyScore\": number (1-100),\n" +
          "  \"briefNote\": \"brief analysis summary\",\n" +
          "  \"strategyExplanation\": \"detailed strategy and analysis matching our standard four sections model\",\n" +
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
        
        // Return local high-fidelity structured analysis fallback
        const lastElement = history[history.length - 1];
        const prevElement = history[history.length - 2];
        const priceChange = lastElement && prevElement ? (lastElement.close - prevElement.close) : 0;
        const rsiVal = lastElement?.rsi || 52;
        
        const localStrategyExplanation = generateLocalInstitutionalAnalysis(symbol, price);
        
        return {
          sentiment: rsiVal > 55 ? "Bullish" : rsiVal < 45 ? "Bearish" : "Neutral",
          confidence: 72,
          risk: "Medium",
          riskPercentage: 45,
          safetyScore: 78,
          briefNote: symbol + " shows structured consolidative behavior with RSI near " + rsiVal.toFixed(1) + ".",
          strategyExplanation: localStrategyExplanation,
          reasons: [
            "Price action trails near the 14-period SMA marker.",
            "Average trading volume aligns with daily distribution guidelines."
          ],
          possibleScenarios: {
            shortTerm: "Consolidates near horizontal support lines.",
            mediumTerm: "Requires sustained index breakout for trend direction."
          },
          keyIndicators: {
            rsi: parseFloat(rsiVal.toFixed(1)),
            macd: "MACD lines align near baseline indicator paths.",
            movingAverages: "14-day simple moving average at ₹" + (lastElement?.ma || price).toFixed(1),
            trend: rsiVal > 55 ? "Bullish" : rsiVal < 45 ? "Bearish" : "Neutral"
          },
          isDemo: true
        };
      }
    }
  }
};
