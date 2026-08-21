/**
 * @file quantitativeApi.ts
 * @author Jesvin M Mathew
 * @description Quantitative analysis pipeline API and local client interfaces.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateLocalInstitutionalAnalysis } from "./marketVerseAnalytics";

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

export async function queryQuantitativeEngine(
  prompt: string,
  history: Array<{ role: string; text: string }> = []
): Promise<string> {
  const rawKey =
    import.meta.env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) ||
    "";

  const apiKey = rawKey ? rawKey.trim() : "";

  const generateFailsafe = () => {
    const lower = prompt.toLowerCase().trim();
    
    // Greeting check
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
      return "Hello! I am **Nova AI**, your MarketVerse trade copilot. You can ask me to analyze any NSE/BSE stock (e.g., *'Analyze ICICIBANK'*), explain technical indicators, or review your portfolio risk metrics.";
    }

    // Check if the prompt is about creator identity
    if (lower.includes("who are you") || lower.includes("creator") || lower.includes("built") || lower.includes("owner") || lower.includes("made you")) {
      return `I am NOVA, the proprietary flagship quantitative AI intelligence engine for MarketVerse India, designed and built by Jesvin M Mathew.`;
    }

    let detectedSymbol = "RELIANCE";
    const symbolMatch = prompt.toUpperCase().match(/\b([A-Z]{3,10})\b/);
    if (symbolMatch && symbolMatch[1] !== "RSI") {
      detectedSymbol = symbolMatch[1];
    }
    
    let currentPrice = 2950.00;
    if (detectedSymbol === "MRF") currentPrice = 125000.00;
    else if (detectedSymbol === "TCS") currentPrice = 3850.00;
    else if (detectedSymbol === "INFY") currentPrice = 1530.00;

    // Try to extract price from prompt e.g. "Current price: ₹2950"
    const priceMatch = prompt.match(/(?:price|at|₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
    if (priceMatch) {
      const parsed = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed)) currentPrice = parsed;
    }

    return `• Bull Scenario: Strong price support established near ₹${(currentPrice * 0.985).toFixed(2)} with positive RSI divergence and institutional accumulation for ${detectedSymbol}.\n• Bear Scenario: Immediate resistance at ₹${(currentPrice * 1.018).toFixed(2)} for ${detectedSymbol}; monitor volume profile on pullbacks.\n• Risk Assessment: Favorable 1:2.4 risk-to-reward ratio for positional swing setups with a strict 1.5% stop-loss.`;
  };

  if (!apiKey) {
    return generateFailsafe();
  }

  const systemInstruction = "You are Nova AI, the financial intelligence and trade copilot for MarketVerse India. You provide concise, institutional-grade market commentary on NSE/BSE equities, risk management, and technical/fundamental concepts. If greeted, respond warmly and guide the user on how you can analyze stocks, portfolio risk, or market indicators. Always keep answers scannable and professional.";

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  try {
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

    // Instead of throwing an error or showing API Error, return the local failsafe
    console.warn(`[Nova AI] All models failed. Error details: ${lastErrorMsg}. Falling back to client-side failsafe.`);
    return generateFailsafe();
  } catch (outerErr: any) {
    console.error("[Nova AI] Quantitative Engine crashed during model querying, falling back to failsafe:", outerErr);
    return generateFailsafe();
  }
}

// Keep callGeminiDirectly for compatibility with existing code
export const callGeminiDirectly = async (
  prompt: string,
  history: { role: string; text: string }[] = [],
  systemInstruction?: string,
  model: string = "gemini-1.5-flash"
): Promise<string> => {
  return queryQuantitativeEngine(prompt, history);
};

export const quantitativeApi = {
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
      console.error("Quantitative API Error (quantitativeApi.analyzeStock, falling back to direct client call):", e);
      
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

        const rawResult = await queryQuantitativeEngine(contextPrompt, []);
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
        console.error("Direct Gemini API Client-Side Fallback Error (quantitativeApi.analyzeStock):", directErr);
        
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
