'use client';

import { AnalysisResult } from '@/types/stock';

interface StockAnalysisProps {
  analysis: AnalysisResult;
}

export default function StockAnalysis({ analysis }: StockAnalysisProps) {
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return 'bg-green-500 text-white';
      case 'buy':
        return 'bg-green-400 text-white';
      case 'hold':
        return 'bg-yellow-400 text-gray-900';
      case 'sell':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return '強い買い';
      case 'buy':
        return '買い';
      case 'hold':
        return '様子見';
      case 'sell':
        return '売り';
      default:
        return '判定不能';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* 総合判定 */}
      <div className="text-center">
        <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold bg-blue-100 text-blue-800`}>
          {analysis.judgment.signal}
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900">
          総合スコア: <span className={getScoreColor(analysis.judgment.score)}>{Math.round(analysis.judgment.score)}/100</span>
        </div>
      </div>

      {/* スコア詳細 */}
      <div className="space-y-4">
        {/* テクニカルスコア */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">テクニカル分析</span>
            <span className={`text-sm font-bold ${getScoreColor(analysis.technical.score)}`}>
              {Math.round(analysis.technical.score)}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getScoreBarColor(analysis.technical.score)}`}
              style={{ width: `${analysis.technical.score}%` }}
            ></div>
          </div>
        </div>

        {/* ファンダメンタルスコア */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">ファンダメンタル分析</span>
            <span className={`text-sm font-bold ${getScoreColor(analysis.fundamental.score)}`}>
              {Math.round(analysis.fundamental.score)}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getScoreBarColor(analysis.fundamental.score)}`}
              style={{ width: `${analysis.fundamental.score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* リスク評価 */}
      {(analysis as any).risk && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">リスク評価</h4>
          <div className="flex items-center mb-2">
            <span className="text-sm text-gray-600 mr-2">リスクレベル:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              (analysis as any).risk.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
              (analysis as any).risk.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {(analysis as any).risk.riskLevel === 'low' ? '低' :
               (analysis as any).risk.riskLevel === 'medium' ? '中' : '高'}
            </span>
          </div>
          {(analysis as any).risk.riskFactors.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">リスク要因:</span>
              <ul className="text-xs text-gray-500 mt-1 space-y-1">
                {(analysis as any).risk.riskFactors.map((factor: string, index: number) => (
                  <li key={index}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 判定基準の説明 */}
      <div className="border-t pt-4 text-xs text-gray-500">
        <div className="space-y-1">
          <div>• 80点以上: 強い買い推奨</div>
          <div>• 65-79点: 買い検討</div>
          <div>• 40-64点: 様子見</div>
          <div>• 40点未満: 慎重判断</div>
        </div>
        <div className="mt-2 text-gray-400">
          ※ テクニカル60% + ファンダメンタル40%で算出
        </div>
      </div>
    </div>
  );
}