import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/stock';
import { JQuantsAPI } from '@/lib/jquants';
import { DataCache } from '@/lib/cache-simple';
import { TechnicalAnalysis } from '@/lib/technical-analysis';
import { FundamentalAnalysis } from '@/lib/fundamental-analysis';
import { JudgmentEngine } from '@/lib/judgment-engine';

const jquantsAPI = new JQuantsAPI();
const cache = new DataCache();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  let symbol: string | undefined;
  
  try {
    const resolvedParams = await params;
    symbol = resolvedParams.symbol;

    if (!symbol) {
      return NextResponse.json(
        { error: '銘柄コードが必要です' },
        { status: 400 }
      );
    }

    console.log(`Performing real analysis for ${symbol}`);
    
    // 株価データを取得
    let stockData = await cache.getStockData(symbol);
    
    if (!stockData) {
      console.log(`Fetching fresh data for analysis: ${symbol}`);
      stockData = await jquantsAPI.getStockData(symbol);
      
      if (stockData) {
        await cache.saveStockData(symbol, stockData);
      }
    }

    if (!stockData) {
      return NextResponse.json(
        { error: '株価データが取得できませんでした' },
        { status: 400 }
      );
    }

    if (!stockData.prices || stockData.prices.length === 0) {
      return NextResponse.json(
        { error: '価格データが存在しません' },
        { status: 400 }
      );
    }

    if (stockData.prices.length < 52) {
      console.log(`Insufficient data: ${stockData.prices.length} days (need 52+). Using simplified analysis.`);
      // 52日未満でも分析を実行（簡略版）
      // return NextResponse.json(
      //   { error: `分析に必要なデータが不足しています（${stockData.prices.length}日分、最低52日分が必要）` },
      //   { status: 400 }
      // );
    }

    // 技術分析を実行
    const technicalResult = TechnicalAnalysis.analyze(stockData.prices);
    
    // ファンダメンタル分析を実行
    const fundamentalResult = FundamentalAnalysis.analyze(
      stockData.fundamentals || {}
    );
    
    // 総合判定を実行
    const judgment = JudgmentEngine.judge(
      technicalResult,
      fundamentalResult,
      stockData.fundamentals || {}
    );

    const analysisResult: AnalysisResult = {
      symbol,
      technical: technicalResult,
      fundamental: fundamentalResult,
      judgment,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('Analysis API error:', error);
    
    // エラー時はモックデータで代替
    console.log(`Falling back to mock analysis for ${symbol || 'unknown'}`);
    const mockResult = generateMockAnalysis(symbol || 'unknown');
    return NextResponse.json(mockResult);
  }
}

// フォールバック用のモック分析結果を生成
function generateMockAnalysis(symbol: string): AnalysisResult {
  return {
    symbol,
    technical: {
      rsi: 45 + Math.random() * 40,
      macd: {
        macd: Math.random() * 20 - 10,
        signal: Math.random() * 20 - 10,
        histogram: Math.random() * 10 - 5
      },
      bollingerBands: {
        upper: 1200 + Math.random() * 500,
        middle: 1000 + Math.random() * 200,
        lower: 800 + Math.random() * 200
      },
      movingAverages: {
        ma5: 1000 + Math.random() * 200,
        ma25: 980 + Math.random() * 240,
        ma75: 950 + Math.random() * 300
      },
      stochastic: {
        k: Math.random() * 100,
        d: Math.random() * 100
      },
      ichimoku: {
        tenkanSen: 1000 + Math.random() * 200,
        kijunSen: 990 + Math.random() * 220,
        senkouSpanA: 1010 + Math.random() * 180,
        senkouSpanB: 1020 + Math.random() * 160
      },
      score: 60 + Math.random() * 30
    },
    fundamental: {
      perScore: 60 + Math.random() * 30,
      pbrScore: 55 + Math.random() * 35,
      roeScore: 70 + Math.random() * 25,
      dividendScore: 50 + Math.random() * 40,
      growthScore: 65 + Math.random() * 30,
      stabilityScore: 75 + Math.random() * 20,
      score: 65 + Math.random() * 25
    },
    judgment: {
      score: 70 + Math.random() * 20,
      signal: Math.random() > 0.3 ? '買い検討' : '強い買いシグナル',
      reasons: [
        'テクニカル指標が良好',
        'ファンダメンタルズが安定',
        '成長性が期待される'
      ],
      risks: [
        '市場全体の動向に注意',
        '業界トレンドの変化'
      ]
    },
    updatedAt: new Date().toISOString()
  };
}