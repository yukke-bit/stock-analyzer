import { StockPrice, TechnicalIndicators } from '@/types/stock';

export class TechnicalAnalysis {
  
  calculateIndicators(prices: StockPrice[]): TechnicalIndicators {
    const closes = prices.map(p => p.close);

    return {
      sma5: this.calculateSMA(closes, 5),
      sma25: this.calculateSMA(closes, 25),
      sma75: this.calculateSMA(closes, 75),
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bollingerBands: this.calculateBollingerBands(closes, 20, 2)
    };
  }

  calculateTechnicalScore(prices: StockPrice[], indicators: TechnicalIndicators): number {
    if (prices.length < 2) return 50;
    
    let score = 0;
    const latest = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    
    // 1. 移動平均線のシグナル (20点)
    const sma5Latest = indicators.sma5[indicators.sma5.length - 1];
    const sma25Latest = indicators.sma25[indicators.sma25.length - 1];
    const sma75Latest = indicators.sma75[indicators.sma75.length - 1];
    
    if (sma5Latest && sma25Latest && sma75Latest) {
      // ゴールデンクロス
      if (sma5Latest > sma25Latest && sma25Latest > sma75Latest) {
        score += 20;
      } else if (sma5Latest > sma25Latest) {
        score += 10;
      } else if (sma5Latest < sma25Latest && sma25Latest < sma75Latest) {
        score += 0; // デッドクロス
      } else {
        score += 5;
      }
    }

    // 2. RSIシグナル (15点)
    const rsiLatest = indicators.rsi[indicators.rsi.length - 1];
    if (rsiLatest) {
      if (rsiLatest < 30) {
        score += 15; // 買われ過ぎ
      } else if (rsiLatest < 50) {
        score += 10;
      } else if (rsiLatest > 70) {
        score += 0; // 売られ過ぎ
      } else {
        score += 5;
      }
    }

    // 3. MACDシグナル (15点)
    const macdLatest = indicators.macd.macd[indicators.macd.macd.length - 1];
    const signalLatest = indicators.macd.signal[indicators.macd.signal.length - 1];
    const histogramLatest = indicators.macd.histogram[indicators.macd.histogram.length - 1];
    
    if (macdLatest && signalLatest && histogramLatest) {
      if (macdLatest > signalLatest && histogramLatest > 0) {
        score += 15;
      } else if (macdLatest > signalLatest) {
        score += 10;
      } else {
        score += 0;
      }
    }

    // 4. ボリンジャーバンドシグナル (15点)
    const bbUpper = indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1];
    const bbLower = indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1];
    const bbMiddle = indicators.bollingerBands.middle[indicators.bollingerBands.middle.length - 1];
    
    if (bbUpper && bbLower && bbMiddle) {
      if (latest.close < bbLower) {
        score += 15; // 下限タッチで買いシグナル
      } else if (latest.close > bbUpper) {
        score += 0; // 上限タッチで売りシグナル
      } else if (latest.close > bbMiddle) {
        score += 10;
      } else {
        score += 5;
      }
    }

    // 5. 価格トレンド (15点)
    const priceChange = (latest.close - previous.close) / previous.close;
    if (priceChange > 0.02) {
      score += 15;
    } else if (priceChange > 0) {
      score += 10;
    } else if (priceChange > -0.02) {
      score += 5;
    } else {
      score += 0;
    }

    // 6. 出来高分析 (10点)
    const avgVolume = prices.slice(-5).reduce((sum, p) => sum + p.volume, 0) / 5;
    if (latest.volume > avgVolume * 1.5) {
      score += 10;
    } else if (latest.volume > avgVolume) {
      score += 5;
    }

    // 7. サポート・レジスタンス (10点)
    const recentHighs = prices.slice(-10).map(p => p.high);
    const recentLows = prices.slice(-10).map(p => p.low);
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);
    
    if (latest.close > resistance) {
      score += 10; // ブレイクアウト
    } else if (latest.close < support) {
      score += 0; // ブレイクダウン
    } else {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  private calculateRSI(closes: number[], period: number = 14): number[] {
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    const rsi: number[] = [];
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }

  private calculateMACD(closes: number[]): { macd: number[], signal: number[], histogram: number[] } {
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    
    const macd: number[] = [];
    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      macd.push(ema12[i] - ema26[i]);
    }

    const signal = this.calculateEMA(macd, 9);
    const histogram: number[] = [];
    
    for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
      histogram.push(macd[i] - signal[i]);
    }

    return { macd, signal, histogram };
  }

  private calculateEMA(data: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema: number[] = [];
    
    ema[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      ema[i] = (data[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }

    return ema;
  }

  private calculateBollingerBands(closes: number[], period: number = 20, multiplier: number = 2) {
    const sma = this.calculateSMA(closes, period);
    const upper: number[] = [];
    const middle: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < sma.length; i++) {
      const slice = closes.slice(i, i + period);
      const stdDev = this.calculateStdDev(slice);
      
      middle.push(sma[i]);
      upper.push(sma[i] + (stdDev * multiplier));
      lower.push(sma[i] - (stdDev * multiplier));
    }

    return { upper, middle, lower };
  }

  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }
}