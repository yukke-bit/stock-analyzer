import { TechnicalAnalysisResult, FundamentalAnalysisResult, JudgmentResult, Fundamentals } from '@/types/stock';
import { FundamentalAnalysis } from './fundamental-analysis';

export class JudgmentEngine {
  /**
   * 総合的な買い時判定を実行
   */
  static judge(
    technical: TechnicalAnalysisResult,
    fundamental: FundamentalAnalysisResult,
    fundamentals: Fundamentals
  ): JudgmentResult {
    // 重み付きスコア計算（テクニカル60%, ファンダメンタル40%）
    const totalScore = Math.round(
      technical.score * 0.6 + fundamental.score * 0.4
    );

    // シグナル判定
    const signal = this.determineSignal(totalScore, technical.score, fundamental.score);
    
    // 判定理由の生成
    const reasons = this.generateReasons(technical, fundamental, fundamentals);
    
    // リスク要因の生成
    const risks = this.generateRisks(technical, fundamental, fundamentals);

    return {
      score: totalScore,
      signal,
      reasons,
      risks
    };
  }

  /**
   * スコアに基づいてシグナルを決定
   */
  private static determineSignal(totalScore: number, technicalScore: number, fundamentalScore: number): string {
    // 両方のスコアが一定水準以上の場合
    if (totalScore >= 80 && technicalScore >= 70 && fundamentalScore >= 70) {
      return '強い買いシグナル';
    }
    
    // 総合スコアが高い場合
    if (totalScore >= 75) {
      return '強い買いシグナル';
    }
    
    // 中程度のスコア
    if (totalScore >= 60) {
      return '買い検討';
    }
    
    // 低いスコア
    if (totalScore >= 40) {
      return '様子見';
    }
    
    // 非常に低いスコア
    return '売り検討';
  }

  /**
   * 判定理由を生成
   */
  private static generateReasons(
    technical: TechnicalAnalysisResult,
    fundamental: FundamentalAnalysisResult,
    fundamentals: Fundamentals
  ): string[] {
    const reasons: string[] = [];

    // テクニカル分析の理由
    const technicalReasons = this.generateTechnicalReasons(technical);
    reasons.push(...technicalReasons);

    // ファンダメンタル分析の理由
    const fundamentalReasons = FundamentalAnalysis.generateReasons(fundamental, fundamentals);
    reasons.push(...fundamentalReasons);

    return reasons;
  }

  /**
   * テクニカル分析の判定理由を生成
   */
  private static generateTechnicalReasons(technical: TechnicalAnalysisResult): string[] {
    const reasons: string[] = [];

    // RSI評価
    if (technical.rsi < 30) {
      reasons.push(`RSI ${technical.rsi.toFixed(1)}で売られすぎ水準`);
    } else if (technical.rsi > 70) {
      reasons.push(`RSI ${technical.rsi.toFixed(1)}で買われすぎ水準`);
    }

    // MACD評価
    if (technical.macd.histogram > 0 && technical.macd.macd > technical.macd.signal) {
      reasons.push('MACDが買いシグナルを示している');
    } else if (technical.macd.histogram < 0) {
      reasons.push('MACDが弱含みの傾向');
    }

    // 移動平均線評価
    const { ma5, ma25, ma75 } = technical.movingAverages;
    if (ma5 > ma25 && ma25 > ma75) {
      reasons.push('移動平均線が上昇トレンドを形成');
    } else if (ma5 > ma25) {
      reasons.push('短期移動平均線が上向き');
    } else if (ma5 < ma25 && ma25 < ma75) {
      reasons.push('移動平均線が下降トレンドを示唆');
    }

    // ボリンジャーバンド評価
    const bbPosition = this.calculateBollingerPosition(technical);
    if (bbPosition < 0.2) {
      reasons.push('ボリンジャーバンド下限近くで反発期待');
    } else if (bbPosition > 0.8) {
      reasons.push('ボリンジャーバンド上限近くで調整懸念');
    }

    // ストキャスティクス評価
    if (technical.stochastic.k < 20 && technical.stochastic.d < 20) {
      reasons.push('ストキャスティクスが売られすぎ圏で推移');
    } else if (technical.stochastic.k > 80 && technical.stochastic.d > 80) {
      reasons.push('ストキャスティクスが買われすぎ圏');
    }

    return reasons.length > 0 ? reasons : ['テクニカル指標は中立的な水準'];
  }

  /**
   * ボリンジャーバンド内の位置を計算
   */
  private static calculateBollingerPosition(technical: TechnicalAnalysisResult): number {
    const { upper, middle, lower } = technical.bollingerBands;
    const range = upper - lower;
    if (range === 0) return 0.5;
    
    // 現在価格を中央線で代用（実際の実装では現在価格を渡す）
    return (middle - lower) / range;
  }

  /**
   * リスク要因を生成
   */
  private static generateRisks(
    technical: TechnicalAnalysisResult,
    fundamental: FundamentalAnalysisResult,
    fundamentals: Fundamentals
  ): string[] {
    const risks: string[] = [];

    // テクニカルリスク
    const technicalRisks = this.generateTechnicalRisks(technical);
    risks.push(...technicalRisks);

    // ファンダメンタルリスク
    const fundamentalRisks = FundamentalAnalysis.generateRisks(fundamental, fundamentals);
    risks.push(...fundamentalRisks);

    // 総合的なリスク
    if (technical.score < 40 && fundamental.score < 40) {
      risks.push('テクニカル・ファンダメンタル両面で弱含み');
    }

    return risks.length > 0 ? risks : ['特段のリスク要因は確認されず'];
  }

  /**
   * テクニカル分析のリスク要因を生成
   */
  private static generateTechnicalRisks(technical: TechnicalAnalysisResult): string[] {
    const risks: string[] = [];

    // RSIリスク
    if (technical.rsi > 80) {
      risks.push('RSIが極度の買われすぎ水準、調整リスク');
    }

    // MACDリスク
    if (technical.macd.histogram < -5) {
      risks.push('MACD強い売りシグナル、下落圧力');
    }

    // 移動平均線リスク
    const { ma5, ma25, ma75 } = technical.movingAverages;
    if (ma5 < ma25 && ma25 < ma75) {
      risks.push('全ての移動平均線が下向き、下降トレンド継続リスク');
    }

    // ストキャスティクスリスク
    if (technical.stochastic.k > 90 && technical.stochastic.d > 90) {
      risks.push('ストキャスティクス極度の買われすぎ、反落リスク');
    }

    // 一目均衡表リスク
    const { tenkanSen, kijunSen, senkouSpanA, senkouSpanB } = technical.ichimoku;
    const cloudBottom = Math.min(senkouSpanA, senkouSpanB);
    
    // 雲の下にいる場合
    if (tenkanSen < cloudBottom && kijunSen < cloudBottom) {
      risks.push('一目均衡表の雲の下で推移、上値重い');
    }

    return risks;
  }

  /**
   * 市場全体の状況を考慮した補正（将来的な拡張用）
   */
  static adjustForMarketCondition(judgment: JudgmentResult): JudgmentResult {
    // 現在は市場状況データがないため、そのまま返す
    // 将来的には日経平均やTOPIXの動向を考慮して調整可能
    return judgment;
  }

  /**
   * セクター特性を考慮した補正（将来的な拡張用）
   */
  static adjustForSector(judgment: JudgmentResult): JudgmentResult {
    // セクター固有の特性を考慮した調整
    // 例：成長セクターではPERが高めでも許容、ディフェンシブセクターでは配当重視など
    return judgment;
  }
}