import { StockInfo, AnalysisResult } from '@/types/stock';
import { TechnicalAnalysis } from './technical';
import { FundamentalAnalysis } from './fundamental';

export class BuyingJudgmentEngine {
  private technicalAnalysis = new TechnicalAnalysis();
  private fundamentalAnalysis = new FundamentalAnalysis();

  analyze(stockInfo: StockInfo): AnalysisResult {
    // テクニカル分析
    const indicators = this.technicalAnalysis.calculateIndicators(stockInfo.prices);
    const technicalScore = this.technicalAnalysis.calculateTechnicalScore(stockInfo.prices, indicators);
    const technicalSignals = this.getTechnicalSignals(stockInfo, indicators);

    // ファンダメンタル分析
    const fundamentalScore = this.fundamentalAnalysis.calculateFundamentalScore(stockInfo);
    const fundamentalSignals = this.fundamentalAnalysis.getFundamentalSignals(stockInfo);

    // 統合スコア計算（テクニカル60%、ファンダメンタル40%）
    const totalScore = Math.round(technicalScore * 0.6 + fundamentalScore * 0.4);

    // 推奨判定
    const recommendation = this.getRecommendation(totalScore, technicalScore, fundamentalScore);

    return {
      symbol: stockInfo.symbol,
      technicalScore,
      fundamentalScore,
      totalScore,
      recommendation,
      signals: {
        technical: technicalSignals,
        fundamental: fundamentalSignals
      },
      updatedAt: new Date().toISOString()
    };
  }

  private getRecommendation(
    totalScore: number, 
    technicalScore: number, 
    fundamentalScore: number
  ): 'strong_buy' | 'buy' | 'hold' | 'sell' {
    if (totalScore >= 80) {
      return 'strong_buy';
    } else if (totalScore >= 65) {
      return 'buy';
    } else if (totalScore >= 40) {
      return 'hold';
    } else {
      return 'sell';
    }
  }

  private getTechnicalSignals(stockInfo: StockInfo, indicators: any): string[] {
    const signals: string[] = [];
    const prices = stockInfo.prices;
    
    if (prices.length < 2) return ['データ不足'];

    const latest = prices[prices.length - 1];
    const previous = prices[prices.length - 2];

    // 移動平均線シグナル
    const sma5 = indicators.sma5[indicators.sma5.length - 1];
    const sma25 = indicators.sma25[indicators.sma25.length - 1];
    const sma75 = indicators.sma75[indicators.sma75.length - 1];

    if (sma5 && sma25 && sma75) {
      if (sma5 > sma25 && sma25 > sma75) {
        signals.push('完璧な上昇トレンド（短期>中期>長期）');
      } else if (sma5 > sma25) {
        signals.push('短期的な上昇トレンド');
      } else if (sma5 < sma25 && sma25 < sma75) {
        signals.push('⚠️ 下降トレンド');
      }
    }

    // RSIシグナル
    const rsi = indicators.rsi[indicators.rsi.length - 1];
    if (rsi) {
      if (rsi < 30) {
        signals.push(`RSI ${rsi.toFixed(1)} - 買われ過ぎ、反発期待`);
      } else if (rsi > 70) {
        signals.push(`⚠️ RSI ${rsi.toFixed(1)} - 売られ過ぎ`);
      }
    }

    // MACDシグナル
    const macd = indicators.macd.macd[indicators.macd.macd.length - 1];
    const signal = indicators.macd.signal[indicators.macd.signal.length - 1];
    const histogram = indicators.macd.histogram[indicators.macd.histogram.length - 1];

    if (macd && signal && histogram) {
      if (macd > signal && histogram > 0) {
        signals.push('MACD買いシグナル');
      } else if (macd < signal && histogram < 0) {
        signals.push('⚠️ MACD売りシグナル');
      }
    }

    // ボリンジャーバンドシグナル
    const bbUpper = indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1];
    const bbLower = indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1];
    const bbMiddle = indicators.bollingerBands.middle[indicators.bollingerBands.middle.length - 1];

    if (bbUpper && bbLower && bbMiddle) {
      if (latest.close < bbLower) {
        signals.push('ボリンジャーバンド下限タッチ - 反発期待');
      } else if (latest.close > bbUpper) {
        signals.push('⚠️ ボリンジャーバンド上限タッチ - 調整注意');
      }
    }

    // 価格変動シグナル
    const priceChange = (latest.close - previous.close) / previous.close * 100;
    if (priceChange > 3) {
      signals.push(`大幅上昇 +${priceChange.toFixed(2)}%`);
    } else if (priceChange < -3) {
      signals.push(`⚠️ 大幅下落 ${priceChange.toFixed(2)}%`);
    }

    // 出来高シグナル
    const avgVolume = prices.slice(-5).reduce((sum, p) => sum + p.volume, 0) / 5;
    if (latest.volume > avgVolume * 2) {
      signals.push('異常出来高 - 注目度上昇');
    } else if (latest.volume > avgVolume * 1.5) {
      signals.push('高出来高');
    }

    return signals.length > 0 ? signals : ['目立ったシグナルなし'];
  }

  // 複数銘柄の比較分析
  compareStocks(analysisResults: AnalysisResult[]): AnalysisResult[] {
    return analysisResults
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((result, index) => ({
        ...result,
        signals: {
          ...result.signals,
          technical: [
            `総合ランキング: ${index + 1}位`,
            ...result.signals.technical
          ]
        }
      }));
  }

  // リスク評価
  assessRisk(stockInfo: StockInfo): {
    riskLevel: 'low' | 'medium' | 'high',
    riskFactors: string[]
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // 価格変動リスク
    if (stockInfo.prices.length >= 20) {
      const returns = stockInfo.prices.slice(1).map((price, i) => 
        (price.close - stockInfo.prices[i].close) / stockInfo.prices[i].close
      );
      
      const volatility = this.calculateVolatility(returns);
      if (volatility > 0.05) {
        riskFactors.push('高いボラティリティ');
        riskScore += 30;
      } else if (volatility > 0.03) {
        riskFactors.push('中程度のボラティリティ');
        riskScore += 15;
      }
    }

    // ファンダメンタルリスク
    if (stockInfo.fundamentals) {
      if (stockInfo.fundamentals.per && stockInfo.fundamentals.per > 30) {
        riskFactors.push('高PER（割高リスク）');
        riskScore += 20;
      }
      
      if (stockInfo.fundamentals.roe && stockInfo.fundamentals.roe < 0) {
        riskFactors.push('ROE赤字（収益性リスク）');
        riskScore += 25;
      }
      
      if (stockInfo.fundamentals.pbr && stockInfo.fundamentals.pbr > 3) {
        riskFactors.push('高PBR（割高リスク）');
        riskScore += 15;
      }
    }

    // 出来高リスク
    const avgVolume = stockInfo.prices.slice(-10).reduce((sum, p) => sum + p.volume, 0) / 10;
    if (avgVolume < 100000) {
      riskFactors.push('低流動性（売買困難リスク）');
      riskScore += 20;
    }

    const riskLevel: 'low' | 'medium' | 'high' = 
      riskScore >= 50 ? 'high' : 
      riskScore >= 25 ? 'medium' : 'low';

    return { riskLevel, riskFactors };
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
}