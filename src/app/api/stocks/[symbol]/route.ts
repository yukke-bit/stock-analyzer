import { NextRequest, NextResponse } from 'next/server';
import { StockInfo, StockPrice } from '@/types/stock';

function generateMockData(symbol: string): StockInfo {
  const prices: StockPrice[] = [];
  const basePrice = 1000 + Math.random() * 2000;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variation = (Math.random() - 0.5) * 0.1;
    const close = basePrice * (1 + variation * i * 0.01);
    const open = close * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume: Math.floor(Math.random() * 1000000)
    });
  }

  return {
    symbol,
    name: `${symbol} 株式会社`,
    prices,
    fundamentals: {
      per: 15.5,
      pbr: 1.2,
      roe: 8.5,
      dividendYield: 2.1,
      marketCap: 1000000000,
      revenue: 500000000
    }
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

    console.log(`Generating mock data for ${symbol}`);
    const stockData = generateMockData(symbol);

    return NextResponse.json(stockData);

  } catch (error) {
    console.error('Stock data API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}