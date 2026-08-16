import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateLocalInstitutionalAnalysis } from "./marketVerseAI";

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

export async function queryNovaAI(
  prompt: string,
  history: Array<{ role: string; text: string }> = []
): Promise<string> {
  const rawKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    "";

  const apiKey = rawKey ? rawKey.trim() : "";

  if (!apiKey) {
    return "⚠️ **Configuration Required:** Gemini API key is missing. Add `VITE_GEMINI_API_KEY=your_key` to your `.env` file and restart Vite.";
  }

  const systemInstruction = `You are NOVA, the proprietary flagship quantitative AI intelligence engine for MarketVerse India.

### Creator & Architect Identity:
- Founder & Lead Developer: Jesvin Mathew (Jesvin).
- Ownership: Jesvin Mathew is the sole founder and architect who built MarketVerse India.
- When asked "Who made you?", "Who owns MarketVerse?", or "Who is your creator?", proudly credit Jesvin Mathew.

### Platform Knowledge (MarketVerse India):
- Institutional-grade trading terminal for Indian equities (NSE/BSE) and derivatives (F&O).
- Modules: Live Simulated Paper Trading, Market Radar/Screener, Portfolio Risk & Beta Analyzer, and Nova AI quant intelligence.

### Style & Behavior:
- Conversational Fluidity: Warm, intelligent, and natural like Google Gemini.
- Casual banter: Friendly, witty, concise.
- Market queries: Clear institutional Markdown breakdowns with key support/resistance levels, targets, and invalidation points.`;

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash-latest'
  ];

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErrorMsg = '';

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: history
          .filter(msg => msg.text && msg.text.trim() !== '')
          .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          }))
      });

      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();
      if (responseText) {
        return responseText;
      }
    } catch (err: any) {
      console.warn(`[Nova AI] ${modelName} failed:`, err?.message || err);
      lastErrorMsg = err?.message || String(err);
      continue;
    }
  }

  return `⚠️ **API Error:** ${lastErrorMsg || 'Unable to connect to Gemini models. Check your API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).'}`;
}

// Keep callGeminiDirectly for compatibility with existing code
export const callGeminiDirectly = async (
  prompt: string,
  history: { role: string; text: string }[] = [],
  systemInstruction?: string,
  model: string = "gemini-1.5-flash"
): Promise<string> => {
  return queryNovaAI(prompt, history);
};

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

        const rawResult = await queryNovaAI(contextPrompt, []);
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
