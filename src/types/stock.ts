export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  prices: StockPrice[];
  fundamentals?: {
    per?: number;
    pbr?: number;
    roe?: number;
    dividendYield?: number;
    marketCap?: number;
    revenue?: number;
  };
}

export interface TechnicalIndicators {
  sma5: number[];
  sma25: number[];
  sma75: number[];
  rsi: number[];
  macd: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  bollingerBands: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
}

export interface AnalysisResult {
  symbol: string;
  technicalScore: number;
  fundamentalScore: number;
  totalScore: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell';
  signals: {
    technical: string[];
    fundamental: string[];
  };
  updatedAt: string;
}