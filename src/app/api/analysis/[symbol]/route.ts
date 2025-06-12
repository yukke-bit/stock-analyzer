import { NextRequest, NextResponse } from 'next/server';
import { YahooFinanceScraper } from '@/lib/scraper';
import { BuyingJudgmentEngine } from '@/lib/judgment';
import { DataCache } from '@/lib/cache';

const scraper = new YahooFinanceScraper();
const judgmentEngine = new BuyingJudgmentEngine();
const cache = new DataCache();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { error: '銘柄コードが必要です' },
        { status: 400 }
      );
    }

    // キャッシュされた分析結果をチェック
    let analysisResult = await cache.getAnalysisResult(symbol);

    if (!analysisResult) {
      // 株価データを取得
      let stockData = await cache.getStockData(symbol);
      
      if (!stockData) {
        stockData = await scraper.getStockData(symbol);
        if (!stockData) {
          return NextResponse.json(
            { error: '株価データの取得に失敗しました' },
            { status: 404 }
          );
        }
        await cache.saveStockData(symbol, stockData);
      }

      // 分析実行
      console.log(`Performing analysis for ${symbol}`);
      analysisResult = judgmentEngine.analyze(stockData);
      
      // リスク評価も追加
      const riskAssessment = judgmentEngine.assessRisk(stockData);
      
      const enhancedResult = {
        ...analysisResult,
        risk: riskAssessment
      };

      // 分析結果をキャッシュ
      await cache.saveAnalysisResult(symbol, enhancedResult);
      analysisResult = enhancedResult;
    }

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: '分析処理でエラーが発生しました' },
      { status: 500 }
    );
  }
}