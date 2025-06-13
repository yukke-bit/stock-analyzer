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

export interface Fundamentals {
  per?: number;
  pbr?: number;
  roe?: number;
  dividendYield?: number;
  marketCap?: number;
  revenue?: number;
}

export interface TechnicalAnalysisResult {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    ma5: number;
    ma25: number;
    ma75: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  ichimoku: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
  };
  score: number;
}

export interface FundamentalAnalysisResult {
  perScore: number;
  pbrScore: number;
  roeScore: number;
  dividendScore: number;
  growthScore: number;
  stabilityScore: number;
  score: number;
}

export interface JudgmentResult {
  score: number;
  signal: string;
  reasons: string[];
  risks: string[];
}

export interface AnalysisResult {
  symbol: string;
  technical: TechnicalAnalysisResult;
  fundamental: FundamentalAnalysisResult;
  judgment: JudgmentResult;
  updatedAt: string;
}