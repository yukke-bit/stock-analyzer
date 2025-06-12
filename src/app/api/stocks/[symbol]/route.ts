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

    // キャッシュから取得を試行
    let stockData = await cache.getStockData(symbol);
    
    if (!stockData) {
      // キャッシュにない場合はスクレイピング
      console.log(`Fetching fresh data for ${symbol}`);
      stockData = await scraper.getStockData(symbol);
      
      if (!stockData) {
        return NextResponse.json(
          { error: '株価データの取得に失敗しました' },
          { status: 404 }
        );
      }

      // キャッシュに保存
      await cache.saveStockData(symbol, stockData);
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