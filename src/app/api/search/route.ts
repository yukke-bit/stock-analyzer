import { NextRequest, NextResponse } from 'next/server';
import { JQuantsAPI } from '@/lib/jquants';
import { DataCache } from '@/lib/cache-simple';
import { searchPopularStocks, POPULAR_STOCKS } from '@/lib/popular-stocks';

const jquantsAPI = new JQuantsAPI();
const cache = new DataCache();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      // クエリがない場合は人気銘柄を返す（フロントエンドの期待形式に変換）
      const popularFormatted = POPULAR_STOCKS.slice(0, 10).map(stock => ({
        symbol: stock.code,
        name: stock.name,
        sector: stock.sector
      }));
      return NextResponse.json(popularFormatted);
    }

    // キャッシュキーを生成
    const cacheKey = `search:${query}`;
    
    // キャッシュから検索結果を取得
    const cachedResults = cache.get<any[]>(cacheKey);
    if (cachedResults && Array.isArray(cachedResults)) {
      console.log(`Using cached search results for query: ${query}`);
      return NextResponse.json(cachedResults);
    }

    console.log(`Searching stocks for query: ${query}`);
    
    try {
      // 効率化された検索（人気銘柄優先、最小API使用）
      const searchResults = await jquantsAPI.searchStocks(query);
      console.log(`J-Quants search returned ${searchResults.length} results:`, searchResults);
      
      // フロントエンドが期待する形式に変換
      const formattedResults = searchResults.map(stock => ({
        symbol: stock.code,
        name: stock.name,
        sector: stock.sector,
        market: stock.market
      }));
      
      console.log(`Formatted results:`, formattedResults);
      
      // 結果をキャッシュ（7日間 - 長期キャッシュでAPI節約）
      cache.set(cacheKey, formattedResults, 7 * 24 * 60); // 7日
      
      return NextResponse.json(formattedResults);
    } catch (apiError) {
      console.warn('Search failed, using popular stocks fallback:', apiError);
      
      // フォールバック: 人気銘柄データベースから検索
      const popularResults = searchPopularStocks(query, 20);
      
      // フロントエンドの期待形式に変換
      const formattedFallback = popularResults.map(stock => ({
        symbol: stock.code,
        name: stock.name,
        sector: stock.sector,
        market: stock.market
      }));

      return NextResponse.json(formattedFallback);
    }

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: '検索でエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { error: '銘柄コードの配列が必要です' },
        { status: 400 }
      );
    }

    const results = POPULAR_STOCKS.filter(stock => 
      symbols.includes(stock.code)
    ).map(stock => ({
      symbol: stock.code,
      name: stock.name,
      sector: stock.sector,
      market: stock.market
    }));

    return NextResponse.json(results);

  } catch (error) {
    console.error('Batch search API error:', error);
    return NextResponse.json(
      { error: 'バッチ検索処理でエラーが発生しました' },
      { status: 500 }
    );
  }
}