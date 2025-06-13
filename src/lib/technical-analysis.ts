import { StockPrice, TechnicalAnalysisResult } from '@/types/stock';

export class TechnicalAnalysis {
  /**
   * 単純移動平均線を計算
   */
  static calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * RSI（相対力指数）を計算
   */
  static calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // 価格変動を計算
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // 初回のRSI計算
    if (gains.length >= period) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      
      let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));

      // 以降のRSI計算（平滑化）
      let smoothGain = avgGain;
      let smoothLoss = avgLoss;

      for (let i = period; i < gains.length; i++) {
        smoothGain = (smoothGain * (period - 1) + gains[i]) / period;
        smoothLoss = (smoothLoss * (period - 1) + losses[i]) / period;
        
        rs = smoothLoss === 0 ? 100 : smoothGain / smoothLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  /**
   * MACD（移動平均収束発散）を計算
   */
  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    
    const macdLine: number[] = [];
    const startIndex = Math.max(ema12.length - ema26.length, 0);
    
    for (let i = 0; i < ema26.length; i++) {
      macdLine.push(ema12[i + startIndex] - ema26[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram: number[] = [];
    
    const histStartIndex = macdLine.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + histStartIndex] - signalLine[i]);
    }

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  /**
   * 指数移動平均線を計算
   */
  static calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    if (prices.length === 0) return ema;
    
    // 初回は単純移動平均
    ema.push(prices[0]);
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    
    return ema;
  }

  /**
   * ボリンジャーバンドを計算
   */
  static calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const smaIndex = i - period + 1;
      upper.push(sma[smaIndex] + (standardDeviation * stdDev));
      lower.push(sma[smaIndex] - (standardDeviation * stdDev));
    }

    return {
      upper,
      middle: sma,
      lower
    };
  }

  /**
   * ストキャスティクスを計算
   */
  static calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3) {
    const kValues: number[] = [];
    
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highSlice = highs.slice(i - kPeriod + 1, i + 1);
      const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
      
      const highestHigh = Math.max(...highSlice);
      const lowestLow = Math.min(...lowSlice);
      
      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    const dValues = this.calculateSMA(kValues, dPeriod);
    
    return {
      k: kValues,
      d: dValues
    };
  }

  /**
   * 一目均衡表を計算
   */
  static calculateIchimoku(highs: number[], lows: number[], closes: number[]) {
    const tenkanSen: number[] = []; // 転換線 (9日)
    const kijunSen: number[] = []; // 基準線 (26日)
    const senkouSpanA: number[] = []; // 先行スパンA
    const senkouSpanB: number[] = []; // 先行スパンB (52日)
    
    // 転換線（9日間の最高値と最安値の平均）
    for (let i = 8; i < closes.length; i++) {
      const high9 = Math.max(...highs.slice(i - 8, i + 1));
      const low9 = Math.min(...lows.slice(i - 8, i + 1));
      tenkanSen.push((high9 + low9) / 2);
    }
    
    // 基準線（26日間の最高値と最安値の平均）
    for (let i = 25; i < closes.length; i++) {
      const high26 = Math.max(...highs.slice(i - 25, i + 1));
      const low26 = Math.min(...lows.slice(i - 25, i + 1));
      kijunSen.push((high26 + low26) / 2);
    }
    
    // 先行スパンA（転換線と基準線の平均）
    const startIndex = Math.max(0, tenkanSen.length - kijunSen.length);
    for (let i = 0; i < kijunSen.length; i++) {
      senkouSpanA.push((tenkanSen[i + startIndex] + kijunSen[i]) / 2);
    }
    
    // 先行スパンB（52日間の最高値と最安値の平均）
    for (let i = 51; i < closes.length; i++) {
      const high52 = Math.max(...highs.slice(i - 51, i + 1));
      const low52 = Math.min(...lows.slice(i - 51, i + 1));
      senkouSpanB.push((high52 + low52) / 2);
    }

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB
    };
  }

  /**
   * 総合的な技術分析を実行
   */
  static analyze(stockPrices: StockPrice[]): TechnicalAnalysisResult {
    if (stockPrices.length < 52) {
      throw new Error('分析には最低52日分のデータが必要です');
    }

    const closes = stockPrices.map(p => p.close);
    const highs = stockPrices.map(p => p.high);
    const lows = stockPrices.map(p => p.low);

    // 各指標を計算
    const sma5 = this.calculateSMA(closes, 5);
    const sma25 = this.calculateSMA(closes, 25);
    const sma75 = this.calculateSMA(closes, 75);
    const rsi = this.calculateRSI(closes);
    const macd = this.calculateMACD(closes);
    const bollinger = this.calculateBollingerBands(closes);
    const stochastic = this.calculateStochastic(highs, lows, closes);
    const ichimoku = this.calculateIchimoku(highs, lows, closes);

    // 最新の値を取得
    const currentPrice = closes[closes.length - 1];
    const latestRsi = rsi[rsi.length - 1] || 50;
    const latestMacd = {
      macd: macd.macd[macd.macd.length - 1] || 0,
      signal: macd.signal[macd.signal.length - 1] || 0,
      histogram: macd.histogram[macd.histogram.length - 1] || 0
    };
    const latestBollinger = {
      upper: bollinger.upper[bollinger.upper.length - 1] || currentPrice * 1.02,
      middle: bollinger.middle[bollinger.middle.length - 1] || currentPrice,
      lower: bollinger.lower[bollinger.lower.length - 1] || currentPrice * 0.98
    };
    const latestSma = {
      ma5: sma5[sma5.length - 1] || currentPrice,
      ma25: sma25[sma25.length - 1] || currentPrice,
      ma75: sma75[sma75.length - 1] || currentPrice
    };
    const latestStochastic = {
      k: stochastic.k[stochastic.k.length - 1] || 50,
      d: stochastic.d[stochastic.d.length - 1] || 50
    };
    const latestIchimoku = {
      tenkanSen: ichimoku.tenkanSen[ichimoku.tenkanSen.length - 1] || currentPrice,
      kijunSen: ichimoku.kijunSen[ichimoku.kijunSen.length - 1] || currentPrice,
      senkouSpanA: ichimoku.senkouSpanA[ichimoku.senkouSpanA.length - 1] || currentPrice,
      senkouSpanB: ichimoku.senkouSpanB[ichimoku.senkouSpanB.length - 1] || currentPrice
    };

    // スコア計算
    const score = this.calculateTechnicalScore({
      currentPrice,
      rsi: latestRsi,
      macd: latestMacd,
      bollinger: latestBollinger,
      sma: latestSma,
      stochastic: latestStochastic,
      ichimoku: latestIchimoku
    });

    return {
      rsi: latestRsi,
      macd: latestMacd,
      bollingerBands: latestBollinger,
      movingAverages: latestSma,
      stochastic: latestStochastic,
      ichimoku: latestIchimoku,
      score
    };
  }

  /**
   * 技術分析スコアを計算（0-100）
   */
  private static calculateTechnicalScore(indicators: {
    currentPrice: number;
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number };
    sma: { ma5: number; ma25: number; ma75: number };
    stochastic: { k: number; d: number };
    ichimoku: { tenkanSen: number; kijunSen: number; senkouSpanA: number; senkouSpanB: number };
  }): number {
    let score = 50; // ベーススコア
    
    // RSI評価（30未満で買いシグナル、70超えで売りシグナル）
    if (indicators.rsi < 30) score += 15;
    else if (indicators.rsi < 40) score += 10;
    else if (indicators.rsi > 70) score -= 15;
    else if (indicators.rsi > 60) score -= 5;

    // MACD評価
    if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) score += 10;
    if (indicators.macd.histogram > 0) score += 5;

    // ボリンジャーバンド評価
    const bollPrice = indicators.currentPrice;
    const bollRange = indicators.bollinger.upper - indicators.bollinger.lower;
    const bollPosition = (bollPrice - indicators.bollinger.lower) / bollRange;
    if (bollPosition < 0.2) score += 10; // 下限近くで買いシグナル
    else if (bollPosition > 0.8) score -= 10; // 上限近くで売りシグナル

    // 移動平均線評価（ゴールデンクロス/デッドクロス）
    if (indicators.sma.ma5 > indicators.sma.ma25 && indicators.sma.ma25 > indicators.sma.ma75) score += 15;
    else if (indicators.sma.ma5 > indicators.sma.ma25) score += 8;
    else if (indicators.sma.ma5 < indicators.sma.ma25) score -= 8;

    // ストキャスティクス評価
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) score += 10;
    else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) score -= 10;

    // 一目均衡表評価（雲の上下）
    const cloudTop = Math.max(indicators.ichimoku.senkouSpanA, indicators.ichimoku.senkouSpanB);
    const cloudBottom = Math.min(indicators.ichimoku.senkouSpanA, indicators.ichimoku.senkouSpanB);
    if (indicators.currentPrice > cloudTop) score += 8;
    else if (indicators.currentPrice < cloudBottom) score -= 8;

    return Math.max(0, Math.min(100, score));
  }
}