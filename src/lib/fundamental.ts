import { StockInfo } from '@/types/stock';

export class FundamentalAnalysis {
  
  calculateFundamentalScore(stockInfo: StockInfo): number {
    if (!stockInfo.fundamentals) return 50;
    
    const { fundamentals } = stockInfo;
    let score = 0;

    // 1. PER分析 (25点)
    if (fundamentals.per) {
      if (fundamentals.per < 10) {
        score += 25; // 非常に割安
      } else if (fundamentals.per < 15) {
        score += 20; // 割安
      } else if (fundamentals.per < 20) {
        score += 15; // 適正
      } else if (fundamentals.per < 30) {
        score += 10; // やや割高
      } else {
        score += 0; // 割高
      }
    }

    // 2. PBR分析 (20点)
    if (fundamentals.pbr) {
      if (fundamentals.pbr < 0.8) {
        score += 20; // 非常に割安
      } else if (fundamentals.pbr < 1.0) {
        score += 15; // 割安
      } else if (fundamentals.pbr < 1.5) {
        score += 10; // 適正
      } else if (fundamentals.pbr < 2.0) {
        score += 5; // やや割高
      } else {
        score += 0; // 割高
      }
    }

    // 3. ROE分析 (20点)
    if (fundamentals.roe) {
      if (fundamentals.roe > 15) {
        score += 20; // 優秀
      } else if (fundamentals.roe > 10) {
        score += 15; // 良好
      } else if (fundamentals.roe > 5) {
        score += 10; // 普通
      } else if (fundamentals.roe > 0) {
        score += 5; // 低い
      } else {
        score += 0; // 赤字
      }
    }

    // 4. 配当利回り分析 (15点)
    if (fundamentals.dividendYield) {
      if (fundamentals.dividendYield > 4) {
        score += 15; // 高配当
      } else if (fundamentals.dividendYield > 2.5) {
        score += 12; // 良好
      } else if (fundamentals.dividendYield > 1) {
        score += 8; // 普通
      } else if (fundamentals.dividendYield > 0) {
        score += 5; // 低配当
      } else {
        score += 0; // 無配
      }
    }

    // 5. 成長性分析 (10点) - 売上成長率の代替として簡易計算
    const revenueGrowthProxy = this.estimateGrowth(fundamentals);
    if (revenueGrowthProxy > 10) {
      score += 10; // 高成長
    } else if (revenueGrowthProxy > 5) {
      score += 8; // 成長
    } else if (revenueGrowthProxy > 0) {
      score += 5; // 微成長
    } else {
      score += 0; // 減収
    }

    // 6. 企業規模・安定性 (10点)
    if (fundamentals.marketCap) {
      if (fundamentals.marketCap > 1000000000000) { // 1兆円以上
        score += 10; // 大型株
      } else if (fundamentals.marketCap > 100000000000) { // 1000億円以上
        score += 8; // 中型株
      } else if (fundamentals.marketCap > 10000000000) { // 100億円以上
        score += 6; // 小型株
      } else {
        score += 4; // 超小型株
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  getFundamentalSignals(stockInfo: StockInfo): string[] {
    const signals: string[] = [];
    const { fundamentals } = stockInfo;

    if (!fundamentals) return ['ファンダメンタルデータなし'];

    // PERシグナル
    if (fundamentals.per) {
      if (fundamentals.per < 10) {
        signals.push(`PER ${fundamentals.per}倍 - 非常に割安`);
      } else if (fundamentals.per < 15) {
        signals.push(`PER ${fundamentals.per}倍 - 割安`);
      } else if (fundamentals.per > 25) {
        signals.push(`PER ${fundamentals.per}倍 - 割高注意`);
      }
    }

    // PBRシグナル
    if (fundamentals.pbr) {
      if (fundamentals.pbr < 1.0) {
        signals.push(`PBR ${fundamentals.pbr}倍 - 資産価値以下`);
      } else if (fundamentals.pbr > 2.0) {
        signals.push(`PBR ${fundamentals.pbr}倍 - 割高`);
      }
    }

    // ROEシグナル
    if (fundamentals.roe) {
      if (fundamentals.roe > 15) {
        signals.push(`ROE ${fundamentals.roe}% - 優秀な収益性`);
      } else if (fundamentals.roe < 5) {
        signals.push(`ROE ${fundamentals.roe}% - 収益性に課題`);
      }
    }

    // 配当利回りシグナル
    if (fundamentals.dividendYield) {
      if (fundamentals.dividendYield > 4) {
        signals.push(`配当利回り ${fundamentals.dividendYield}% - 高配当`);
      } else if (fundamentals.dividendYield === 0) {
        signals.push('無配当株');
      }
    }

    // 複合シグナル
    if (fundamentals.per && fundamentals.pbr && fundamentals.per < 15 && fundamentals.pbr < 1.5) {
      signals.push('割安株の可能性');
    }

    if (fundamentals.roe && fundamentals.dividendYield && fundamentals.roe > 10 && fundamentals.dividendYield > 2) {
      signals.push('収益性・配当両面で魅力的');
    }

    return signals.length > 0 ? signals : ['特筆すべきシグナルなし'];
  }

  private estimateGrowth(fundamentals: any): number {
    // 簡易的な成長率推定
    // ROEと配当利回りから成長性を推定
    const roe = fundamentals.roe || 0;
    const dividendYield = fundamentals.dividendYield || 0;
    
    // 内部留保率を考慮した成長率推定
    const retentionRatio = Math.max(0, 1 - (dividendYield / (roe || 1)));
    return roe * retentionRatio;
  }

  // 業界平均との比較（簡易版）
  getIndustryComparison(fundamentals: any): string[] {
    const comparisons: string[] = [];
    
    // 業界平均（仮の値）
    const industryAvg = {
      per: 18,
      pbr: 1.3,
      roe: 8,
      dividendYield: 2.2
    };

    if (fundamentals.per && fundamentals.per < industryAvg.per) {
      comparisons.push('業界平均よりPERが低い');
    }

    if (fundamentals.pbr && fundamentals.pbr < industryAvg.pbr) {
      comparisons.push('業界平均よりPBRが低い');
    }

    if (fundamentals.roe && fundamentals.roe > industryAvg.roe) {
      comparisons.push('業界平均よりROEが高い');
    }

    if (fundamentals.dividendYield && fundamentals.dividendYield > industryAvg.dividendYield) {
      comparisons.push('業界平均より配当利回りが高い');
    }

    return comparisons;
  }
}