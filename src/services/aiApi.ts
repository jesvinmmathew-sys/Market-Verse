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
      
      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
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
        } catch (directErr) {
          console.error("Direct Gemini API Client-Side Fallback Error (aiApi.analyzeStock):", directErr);
          // Fall through to high quality dummy technical fallback
        }
      }
    }

    // High quality dynamic fallback (Demo Mode) based on current price trend and indicators
    const lastElement = history[history.length - 1];
    const prevElement = history[history.length - 2];
    
    let sentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let confidence = 75;
    let risk: "Low" | "Medium" | "High" = "Medium";
    let riskPercentage = 45;
    let safetyScore = 65;
    let briefNote = "";
    let explanation = "";

    const priceChange = lastElement && prevElement ? (lastElement.close - prevElement.close) : 0;
    const rsi = lastElement?.rsi || 50;

    const dummyReasons = [
      "Price momentum indicates a shift of " + (priceChange > 0 ? "+" : "") + priceChange.toFixed(2),
      "Relative Strength Index (RSI) evaluates near " + rsi.toFixed(1),
      "Volume registers standard liquidity support bounds",
      "Asset exhibits consolidative structural alignment"
    ];

    const dummyScenarios = {
      shortTerm: "Consolidation within current support margins with low immediate volatility.",
      mediumTerm: "Subject to sector breakout trends and broader benchmark index support levels."
    };

    const dummyKeyIndicators = {
      rsi: parseFloat(rsi.toFixed(1)),
      macd: "Convergence is stable below primary baseline indicators.",
      movingAverages: "14-day simple moving average at ₹" + (lastElement?.ma || price).toFixed(1),
      trend: sentiment
    };

    if (rsi > 65) {
      sentiment = "Bullish";
      confidence = Math.floor(70 + Math.random() * 20);
      risk = "High";
      riskPercentage = Math.floor(65 + Math.random() * 15);
      safetyScore = Math.floor(40 + Math.random() * 15);
      briefNote = symbol + " demonstrates high velocity expansion with rising momentum and sustained institutional interest.";
      explanation = "Technical analysis of " + symbol + " indicates strong momentum. The price at ₹" + price + " stands above its 14-period Simple Moving Average. With an RSI of " + rsi.toFixed(1) + ", the asset is exhibiting high relative strength but is entering overbought territory. Short-term momentum remains heavily long, though risk management is advised due to potential profit-taking at key psychological barriers.";
    } else if (rsi < 35) {
      sentiment = "Bearish";
      confidence = Math.floor(65 + Math.random() * 15);
      risk = "High";
      riskPercentage = Math.floor(75 + Math.random() * 15);
      safetyScore = Math.floor(25 + Math.random() * 15);
      briefNote = symbol + " is experiencing high liquidation pressure with severe downward bias and thin buyer support.";
      explanation = "The technical layout for " + symbol + " shows deep selling pressure with the price at ₹" + price + " trading below the 14-day SMA. The RSI has dipped to " + rsi.toFixed(1) + ", which signals extreme oversold conditions. A short-covering rally or dead-cat rebound may occur, but primary trend indices remain bearish. Caution is advised as bottom-fishing carries high risk before a clear support floor is validated.";
    } else {
      sentiment = priceChange >= 0 ? "Bullish" : "Bearish";
      confidence = Math.floor(55 + Math.random() * 15);
      risk = "Medium";
      riskPercentage = Math.floor(35 + Math.random() * 15);
      safetyScore = Math.floor(70 + Math.random() * 15);
      briefNote = symbol + " is consolidating inside a stable structural range with balanced daily accumulation pools.";
      explanation = "Indicators for " + symbol + " reflect a consolidative, range-bound behavior. Price ₹" + price + " is resting close to its 14-period SMA (₹" + (lastElement?.ma || price).toFixed(1) + ") with a neutral RSI of " + rsi.toFixed(1) + ". Volume indicators are stable, showing balanced accumulation. We recommend looking for a breakout past the Bollinger Bands (Upper: ₹" + (lastElement?.bbands?.upper || price).toFixed(1) + ", Lower: ₹" + (lastElement?.bbands?.lower || price).toFixed(1) + ") for direction.";
    }

    explanation += " Disclaimer: This represents an automated analytical summary. Past performance does not guarantee future results. Never risk capital you cannot afford to lose.";

    return {
      sentiment,
      confidence,
      risk,
      riskPercentage,
      safetyScore,
      briefNote,
      strategyExplanation: explanation,
      reasons: dummyReasons,
      possibleScenarios: dummyScenarios,
      keyIndicators: dummyKeyIndicators,
      isDemo: true
    };
  }
};
