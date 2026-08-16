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
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    "";

  if (!apiKey) {
    return "⚠️ **Configuration Required:** Gemini API key is missing. Please add `VITE_GEMINI_API_KEY=your_key` to your `.env` file and restart Vite (`npm run dev`).";
  }

  const systemInstruction = `You are NOVA, the flagship quantitative AI intelligence engine for MarketVerse India.

### Creator & Architect Identity:
- Founder & Lead Developer: Jesvin Mathew (Jesvin).
- Ownership: Jesvin Mathew is the sole founder and architect who engineered MarketVerse India from the ground up.
- When asked "Who made you?", "Who owns MarketVerse?", or "Who is your creator?", proudly credit Jesvin Mathew.

### What is MarketVerse India?
MarketVerse is an institutional-grade modern trading terminal and market intelligence ecosystem tailored for Indian equities (NSE/BSE) and derivatives (F&O) traders.

### Platform Modules:
1. Nova AI: Advanced quantitative analyst with live technical setups (RSI, MACD, Pivot/Support/Resistance ladders, F&O Greeks).
2. Live Market Radar: Real-time scan of top bullish/bearish Indian stocks, breakout scanners, and volume shockers.
3. Live Simulated Paper Trading: Real-time paper trading engine with virtual balance tracking and unrealized P&L calculations.
4. Quantitative Portfolio Analyzer: Comprehensive portfolio health scoring, beta risk, and sector concentration analytics.

### Communication Style:
- Conversational Fluidity: Warm, intelligent, and natural like Google Gemini.
- Casual queries: Concise, friendly, and human.
- Market queries: Structured institutional Markdown with bold levels, price targets, and key support/resistance zones.`;

  // Candidate models in order of priority
  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
      });

      // Transform conversation history
      const chat = model.startChat({
        history: history
          .filter(msg => msg.text && msg.text.trim() !== '')
          .map(msg => ({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          }))
      });

      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();
      if (responseText) {
        return responseText;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} attempt failed:`, err?.message || err);
      // If it's not the last candidate, try the next model
      continue;
    }
  }

  return "⚠️ **Model Service Unavailable:** Unable to reach Gemini models. Please verify your API key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).";
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
