import { NextRequest, NextResponse } from 'next/server';
import { StockPrice, Fundamentals, AnalysisResult } from '@/types/stock';

// モック分析結果を生成
function generateMockAnalysis(symbol: string): AnalysisResult {
  return {
    symbol,
    technical: {
      rsi: 45 + Math.random() * 40, // 45-85の範囲
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

    console.log(`Generating mock analysis for ${symbol}`);
    const analysisResult = generateMockAnalysis(symbol);

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: '分析処理に失敗しました' },
      { status: 500 }
    );
  }
}