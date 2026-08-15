// MarketVerse AI - Premium Indian Stock Market Intelligence Agent (Client Service)
import { INDIAN_STOCK_UNIVERSE } from "./indianStocksDb";

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

// Client-side helper for direct Gemini REST call
export const callGeminiDirectly = async (
  prompt: string,
  history: { role: "user" | "model"; text: string }[] = [],
  systemInstruction?: string,
  model: string = "gemini-1.5-flash"
): Promise<string> => {
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

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
  
  const contents = history.map(h => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.text }]
  }));
  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  const requestBody: any = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
  };
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
  } catch (netErr: any) {
    throw new Error("Gemini Connection Failed: " + netErr.message);
  }

  if (!response.ok) {
    let errData;
    try {
      errData = await response.json();
    } catch (parseErr) {
      try {
        errData = await response.text();
      } catch (textErr) {
        errData = "Unknown Error Response";
      }
    }
    console.error("Gemini Error:", errData);
    const detail = typeof errData === "object" ? JSON.stringify(errData) : errData;
    throw new Error("Gemini API Error (" + response.status + "): " + detail);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from direct Gemini API");
  }
  return text;
};

export const marketVerseAI = {
  /**
   * Complete natural language chat with conversation memory support.
   */
  async chatWithMarketAI(question: string, history: { role: "user" | "model"; text: string }[] = []): Promise<string> {
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history })
      });
      if (response.ok) {
        const data = await response.json();
        return data.answer;
      }
      throw new Error("Server /api/ai/chat returned status " + response.status);
    } catch (error) {
      console.error("AI API Error (chatWithMarketAI):", error);
      
      // Attempt direct client-side fallback
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

      console.log("Using direct client-side Gemini fallback for chat...");
      try {
        let marketContext = "";
        try {
          const newsRes = await fetch("/api/market/news");
          if (newsRes.ok) {
            const newsData = await newsRes.json();
            if (newsData && newsData.length > 0) {
              marketContext = "Current active Indian stock market news:\n" + 
                newsData.slice(0, 3).map((n: any) => "- " + n.title + ": " + (n.description || "")).join("\n");
            }
          }
        } catch (ctxErr) {
          // ignore
        }

        const systemPrompt = "You are Nova AI (v2.5), a premium institutional Indian Stock Market Intelligence assistant. " +
          "You specialize in technical analysis, F&O setups, block deals, and macro trends in NIFTY 50 and Indian equities. " +
          "Answer the user's queries concisely and professionally." + 
          (marketContext ? "\n" + marketContext : "");

        return await callGeminiDirectly(question, history, systemPrompt);
      } catch (directErr: any) {
        console.error("Direct Gemini API Client-Side Fallback Error (chatWithMarketAI):", directErr);
        throw directErr;
      }
    }
  },

  /**
   * Detailed technical and sentiment review of an Indian stock symbol.
   */
  async analyzeStock(symbol: string): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol })
      });
      if (response.ok) {
        return response.json();
      }
      throw new Error("Server /api/ai/analyze-stock returned status " + response.status);
    } catch (error) {
      console.error("AI API Error (analyzeStock for " + symbol + "):", error);

      // Attempt direct client-side fallback
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

      console.log("Using direct client-side Gemini fallback for analyzing " + symbol + "...");
      try {
        let quoteText = "";
        try {
          const quoteRes = await fetch("/api/market/quote?symbol=" + encodeURIComponent(symbol));
          if (quoteRes.ok) {
            const q = await quoteRes.json();
            quoteText = "Live stock data for " + symbol + ": Price: ₹" + q.price + ", Change: " + q.change + " (" + q.percentChange + "%), High: ₹" + q.high + ", Low: ₹" + q.low + ", Vol: " + q.volume + ".";
          }
        } catch (ctxErr) {
          const fallbackObj = INDIAN_STOCK_UNIVERSE.find(s => s.symbol === symbol.toUpperCase());
          if (fallbackObj) {
            quoteText = "Simulated stock data for " + symbol + ": Price: ₹" + (fallbackObj.price || 100) + ", Change: +1.2%, High: ₹" + ((fallbackObj.price || 100) * 1.01) + ", Low: ₹" + ((fallbackObj.price || 100) * 0.99) + ".";
          }
        }

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

        const prompt = quoteText + "\nAnalyze the technicals, risk, and price targets for " + symbol + ".";
        const rawResult = await callGeminiDirectly(prompt, [], systemPrompt);
        
        const cleanedJsonStr = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedJsonStr);
      } catch (directErr: any) {
        console.error("Direct Gemini API Client-Side Fallback Error (analyzeStock for " + symbol + "):", directErr);
        throw directErr;
      }
    }
  },

  /**
   * Direct prompt queries to the Indian market analyst model.
   */
  async marketQuestion(question: string): Promise<string> {
    return this.chatWithMarketAI(question, []);
  }
};
