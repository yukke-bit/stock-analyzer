import { NextRequest, NextResponse } from 'next/server';
import { YahooFinanceScraper } from '@/lib/scraper';
import { DataCache } from '@/lib/cache';

const scraper = new YahooFinanceScraper();
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

    // Vercel環境ではキャッシュをスキップしてモックデータを直接使用
    console.log(`Fetching mock data for ${symbol}`);
    const stockData = await scraper.getStockData(symbol);
    
    if (!stockData) {
      console.error(`No stock data returned for ${symbol}`);
      return NextResponse.json(
        { error: '株価データの取得に失敗しました' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockData);

  } catch (error) {
    console.error('Stock data API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}