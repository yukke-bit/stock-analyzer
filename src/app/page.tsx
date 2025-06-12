'use client';

import { useState } from 'react';
import StockSearch from '@/components/StockSearch';
import StockAnalysis from '@/components/StockAnalysis';
import StockChart from '@/components/StockChart';
import { AnalysisResult, StockInfo } from '@/types/stock';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [stockData, setStockData] = useState<StockInfo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleStockSelect = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setError('');
    setLoading(true);

    try {
      // 株価データ取得
      const stockResponse = await fetch(`/api/stocks/${symbol}`);
      if (!stockResponse.ok) {
        throw new Error('株価データの取得に失敗しました');
      }
      const stockData = await stockResponse.json();
      setStockData(stockData);

      // 分析実行
      const analysisResponse = await fetch(`/api/analysis/${symbol}`);
      if (!analysisResponse.ok) {
        throw new Error('分析処理に失敗しました');
      }
      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData);

    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
      setStockData(null);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              📈 株価分析システム
            </h1>
            <div className="text-sm text-gray-500">
              日本株のテクニカル・ファンダメンタル分析
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索セクション */}
        <div className="mb-8">
          <StockSearch onSelectStock={handleStockSelect} />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ローディング表示 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">分析中...</span>
          </div>
        )}

        {/* 分析結果表示 */}
        {stockData && analysis && !loading && (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {stockData.name} ({stockData.symbol})
                  </h2>
                  <p className="text-sm text-gray-500">
                    最終更新: {new Date(analysis.updatedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{stockData.prices[stockData.prices.length - 1]?.close.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stockData.prices.length > 1 && (
                      <span className={
                        stockData.prices[stockData.prices.length - 1].close > 
                        stockData.prices[stockData.prices.length - 2].close
                          ? 'text-green-600' : 'text-red-600'
                      }>
                        {((stockData.prices[stockData.prices.length - 1].close - 
                           stockData.prices[stockData.prices.length - 2].close) /
                           stockData.prices[stockData.prices.length - 2].close * 100).toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* チャートと分析結果を並べて表示 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* チャート */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">株価チャート</h3>
                <StockChart stockData={stockData} />
              </div>

              {/* 分析結果 */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">買い時分析</h3>
                <StockAnalysis analysis={analysis} />
              </div>
            </div>

            {/* 詳細分析シグナル */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* テクニカルシグナル */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  テクニカルシグナル (スコア: {analysis.technicalScore}/100)
                </h3>
                <ul className="space-y-2">
                  {analysis.signals.technical.map((signal, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ファンダメンタルシグナル */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ファンダメンタルシグナル (スコア: {analysis.fundamentalScore}/100)
                </h3>
                <ul className="space-y-2">
                  {analysis.signals.fundamental.map((signal, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 初期状態のメッセージ */}
        {!selectedSymbol && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              上記から銘柄を検索・選択して分析を開始してください
            </div>
            <div className="text-sm text-gray-400 mt-2">
              テクニカル分析とファンダメンタル分析で買い時を判定します
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            ⚠️ 投資判断は自己責任で行ってください。このシステムの分析結果は参考情報です。
          </div>
        </div>
      </footer>
    </div>
  );
}