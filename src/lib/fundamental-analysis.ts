import { Fundamentals, FundamentalAnalysisResult } from '@/types/stock';

export class FundamentalAnalysis {
  /**
   * 総合的なファンダメンタル分析を実行
   */
  static analyze(fundamentals: Fundamentals): FundamentalAnalysisResult {
    const perScore = this.calculatePERScore(fundamentals.per);
    const pbrScore = this.calculatePBRScore(fundamentals.pbr);
    const roeScore = this.calculateROEScore(fundamentals.roe);
    const dividendScore = this.calculateDividendScore(fundamentals.dividendYield);
    const growthScore = this.calculateGrowthScore(fundamentals);
    const stabilityScore = this.calculateStabilityScore(fundamentals);

    // 各スコアの重み付け平均を計算
    const totalScore = (
      perScore * 0.20 +        // PER: 20%
      pbrScore * 0.15 +        // PBR: 15%
      roeScore * 0.25 +        // ROE: 25%
      dividendScore * 0.15 +   // 配当利回り: 15%
      growthScore * 0.15 +     // 成長性: 15%
      stabilityScore * 0.10    // 安定性: 10%
    );

    return {
      perScore,
      pbrScore,
      roeScore,
      dividendScore,
      growthScore,
      stabilityScore,
      score: Math.round(totalScore)
    };
  }

  /**
   * PER（株価収益率）スコアを計算
   * 一般的に15倍以下で割安、25倍以上で割高とされる
   */
  private static calculatePERScore(per?: number): number {
    if (!per || per <= 0) return 50; // データなしまたは無効値

    if (per < 8) return 85;      // 非常に割安
    if (per < 12) return 80;     // 割安
    if (per < 15) return 75;     // やや割安
    if (per < 20) return 65;     // 適正
    if (per < 25) return 50;     // やや割高
    if (per < 35) return 35;     // 割高
    return 20;                   // 非常に割高
  }

  /**
   * PBR（株価純資産倍率）スコアを計算
   * 一般的に1倍以下で割安、2倍以上で割高とされる
   */
  private static calculatePBRScore(pbr?: number): number {
    if (!pbr || pbr <= 0) return 50; // データなしまたは無効値

    if (pbr < 0.5) return 90;    // 非常に割安（ただし注意が必要）
    if (pbr < 0.8) return 85;    // 割安
    if (pbr < 1.0) return 80;    // やや割安
    if (pbr < 1.5) return 70;    // 適正
    if (pbr < 2.0) return 55;    // やや割高
    if (pbr < 3.0) return 40;    // 割高
    return 25;                   // 非常に割高
  }

  /**
   * ROE（自己資本利益率）スコアを計算
   * 一般的に8%以上で良好、15%以上で優秀とされる
   */
  private static calculateROEScore(roe?: number): number {
    if (!roe) return 50; // データなし

    if (roe < 0) return 20;      // 赤字
    if (roe < 3) return 30;      // 低収益
    if (roe < 8) return 45;      // やや低収益
    if (roe < 15) return 70;     // 良好
    if (roe < 25) return 85;     // 優秀
    if (roe < 35) return 90;     // 非常に優秀
    return 80;                   // 異常に高い（持続可能性に疑問）
  }

  /**
   * 配当利回りスコアを計算
   * 一般的に2-4%程度が適正とされる
   */
  private static calculateDividendScore(dividendYield?: number): number {
    if (!dividendYield) return 40; // 無配当

    if (dividendYield < 0.5) return 45;  // 極低配当
    if (dividendYield < 1.5) return 55;  // 低配当
    if (dividendYield < 3.0) return 75;  // 適正配当
    if (dividendYield < 5.0) return 85;  // 高配当
    if (dividendYield < 8.0) return 70;  // 非常に高配当（リスクあり）
    return 50;                           // 異常な高配当（要注意）
  }

  /**
   * 成長性スコアを計算
   * 売上高、時価総額などから推定
   */
  private static calculateGrowthScore(fundamentals: Fundamentals): number {
    let score = 50; // ベーススコア

    // 時価総額による調整（規模による成長性の違い）
    if (fundamentals.marketCap) {
      const marketCapBillion = fundamentals.marketCap / 1000000000; // 10億円単位
      
      if (marketCapBillion < 100) {      // 100億円未満（小型株）
        score += 15; // 成長余地が大きい
      } else if (marketCapBillion < 1000) { // 1000億円未満（中型株）
        score += 8;
      } else if (marketCapBillion < 5000) { // 5000億円未満（大型株）
        score += 3;
      }
      // 超大型株は成長性で減点しない（安定性で評価）
    }

    // ROEが高い場合は成長性も高いと評価
    if (fundamentals.roe && fundamentals.roe > 15) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 安定性スコアを計算
   * 財務健全性、規模、業界地位などから評価
   */
  private static calculateStabilityScore(fundamentals: Fundamentals): number {
    let score = 50; // ベーススコア

    // 時価総額による安定性評価
    if (fundamentals.marketCap) {
      const marketCapBillion = fundamentals.marketCap / 1000000000;
      
      if (marketCapBillion > 5000) {      // 5000億円以上（超大型株）
        score += 20;
      } else if (marketCapBillion > 1000) { // 1000億円以上（大型株）
        score += 15;
      } else if (marketCapBillion > 300) {  // 300億円以上（中型株）
        score += 8;
      } else if (marketCapBillion > 100) {  // 100億円以上（小型株）
        score += 3;
      }
      // 100億円未満は安定性で減点
    }

    // PBRが低すぎる場合は財務に問題がある可能性
    if (fundamentals.pbr && fundamentals.pbr < 0.5) {
      score -= 15;
    }

    // ROEが安定している場合は加点
    if (fundamentals.roe && fundamentals.roe >= 8 && fundamentals.roe <= 25) {
      score += 10;
    }

    // 配当を継続している場合は安定性が高い
    if (fundamentals.dividendYield && fundamentals.dividendYield > 1) {
      score += 8;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * ファンダメンタル分析の判定理由を生成
   */
  static generateReasons(analysis: FundamentalAnalysisResult, fundamentals: Fundamentals): string[] {
    const reasons: string[] = [];

    // PER評価
    if (analysis.perScore >= 75 && fundamentals.per) {
      reasons.push(`PER ${fundamentals.per.toFixed(1)}倍で割安水準`);
    } else if (analysis.perScore <= 40 && fundamentals.per) {
      reasons.push(`PER ${fundamentals.per.toFixed(1)}倍で割高傾向`);
    }

    // PBR評価
    if (analysis.pbrScore >= 80 && fundamentals.pbr) {
      reasons.push(`PBR ${fundamentals.pbr.toFixed(2)}倍で資産価値に対して割安`);
    }

    // ROE評価
    if (analysis.roeScore >= 80 && fundamentals.roe) {
      reasons.push(`ROE ${fundamentals.roe.toFixed(1)}%と高い収益性`);
    } else if (analysis.roeScore <= 40 && fundamentals.roe) {
      reasons.push(`ROE ${fundamentals.roe.toFixed(1)}%と収益性に課題`);
    }

    // 配当評価
    if (analysis.dividendScore >= 75 && fundamentals.dividendYield) {
      reasons.push(`配当利回り ${fundamentals.dividendYield.toFixed(2)}%と魅力的`);
    }

    // 成長性評価
    if (analysis.growthScore >= 70) {
      reasons.push('将来の成長余地が期待される');
    }

    // 安定性評価
    if (analysis.stabilityScore >= 80) {
      reasons.push('財務面での安定性が高い');
    }

    return reasons.length > 0 ? reasons : ['ファンダメンタルズは標準的な水準'];
  }

  /**
   * ファンダメンタル分析のリスク要因を生成
   */
  static generateRisks(analysis: FundamentalAnalysisResult, fundamentals: Fundamentals): string[] {
    const risks: string[] = [];

    // PER警告
    if (analysis.perScore <= 35 && fundamentals.per) {
      risks.push(`PER ${fundamentals.per.toFixed(1)}倍と高水準、期待値調整リスク`);
    }

    // PBR警告
    if (fundamentals.pbr && fundamentals.pbr < 0.5) {
      risks.push('PBRが0.5倍を下回り、財務状況に注意が必要');
    }

    // ROE警告
    if (analysis.roeScore <= 35) {
      risks.push('収益性の改善が課題');
    }

    // 配当警告
    if (fundamentals.dividendYield && fundamentals.dividendYield > 6) {
      risks.push('配当利回りが高く、減配リスクに注意');
    }

    // 成長性警告
    if (analysis.growthScore <= 40) {
      risks.push('成長余地が限定的');
    }

    // 安定性警告
    if (analysis.stabilityScore <= 40) {
      risks.push('財務安定性に改善の余地');
    }

    return risks.length > 0 ? risks : ['特段のリスク要因は確認されず'];
  }
}