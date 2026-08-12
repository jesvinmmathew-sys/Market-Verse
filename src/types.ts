export interface Message {
  id: string;
  sender: string;
  avatarLetter: string;
  senderEmail: string;
  subject: string;
  preview: string;
  time: string;
  category: "Work" | "Personal" | "Travel" | "Finance";
  color: string;
  isUnread: boolean;
  isActive?: boolean;
  summary?: string;
  bodyParagraphs: string[];
  hasAttachment?: boolean;
  attachmentName?: string;
}

export interface StockHistoryItem {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: { macd: number; signal: number; hist: number };
  ma?: number;
  bbands?: { upper: number; middle: number; lower: number };
}

export interface Stock {
  symbol: string;
  name: string;
  type: "india" | "forex";
  price: number;
  change: number;
  percentChange: number;
  volume: string;
  marketCap?: string;
  dayHigh: number;
  dayLow: number;
  high52?: number;
  low52?: number;
  trend?: "up" | "down" | "flat";
  history: StockHistoryItem[];
  isLive?: boolean;
  sector?: string;
  exchange?: "NSE" | "BSE";
  dataStatus?: "LIVE" | "DELAYED" | "DEMO";
  source?: string;
  open?: number;
  previousClose?: number;
  timestamp?: string;
  debug?: {
    provider: string;
    timestamp: string;
    symbolSent: string;
    rawResponse: any;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: "Breaking" | "Company" | "Global" | "Economy";
  marketImpact: "High" | "Medium" | "Low";
  impactDirection: "Positive" | "Negative" | "Neutral";
  preview: string;
  aiSummary: string;
  createdAt?: number;
  impactScore?: number; // AI-analyzed relevance score (0-100)
  relatedSymbols?: string[]; // Asset symbols relevant to this news (e.g., ["RELIANCE", "NIFTY50"])
}

export interface LessonSection {
  title: string;
  content: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  time: string;
  level: string;
  sections: LessonSection[];
  strategy: string;
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  type: "india" | "forex";
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
  type: "india" | "forex";
}
