import { NextRequest, NextResponse } from 'next/server';
import { JQuantsAPI } from '@/lib/jquants';
import { DataCache } from '@/lib/cache-simple';

const jquantsAPI = new JQuantsAPI();
const cache = new DataCache();

// 人気銘柄のフォールバック
const POPULAR_STOCKS = [
  { code: '7203', name: 'トヨタ自動車', sector: '輸送用機器', market: 'プライム', scaleCategory: '大型' },
  { code: '9984', name: 'ソフトバンクグループ', sector: '情報・通信業', market: 'プライム', scaleCategory: '大型' },
  { code: '7974', name: '任天堂', sector: 'その他製品', market: 'プライム', scaleCategory: '大型' },
  { code: '6758', name: 'ソニーグループ', sector: '電気機器', market: 'プライム', scaleCategory: '大型' },
  { code: '9434', name: 'ソフトバンク', sector: '情報・通信業', market: 'プライム', scaleCategory: '大型' },
  { code: '4689', name: 'Zホールディングス', sector: '情報・通信業', market: 'プライム', scaleCategory: '大型' },
  { code: '6861', name: 'キーエンス', sector: '電気機器', market: 'プライム', scaleCategory: '大型' },
  { code: '8035', name: '東京エレクトロン', sector: '電気機器', market: 'プライム', scaleCategory: '大型' },
  { code: '9983', name: 'ファーストリテイリング', sector: '小売業', market: 'プライム', scaleCategory: '大型' },
  { code: '4063', name: '信越化学工業', sector: '化学', market: 'プライム', scaleCategory: '大型' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      // クエリがない場合は人気銘柄を返す
      return NextResponse.json({
        results: POPULAR_STOCKS,
        total: POPULAR_STOCKS.length,
        isPopular: true
      });
    }

    // キャッシュキーを生成
    const cacheKey = `search:${query}`;
    
    // キャッシュから検索結果を取得
    const cachedResults = cache.get<any[]>(cacheKey);
    if (cachedResults && Array.isArray(cachedResults)) {
      console.log(`Using cached search results for query: ${query}`);
      return NextResponse.json({
        results: cachedResults,
        total: cachedResults.length,
        query,
        cached: true
      });
    }

    console.log(`Searching stocks for query: ${query}`);
    
    try {
      // J-Quants APIで検索
      const searchResults = await jquantsAPI.searchStocks(query);
      
      // 結果をキャッシュ（30分間）
      cache.set(cacheKey, searchResults, 30);
      
      return NextResponse.json({
        results: searchResults,
        total: searchResults.length,
        query
      });
    } catch (apiError) {
      console.warn('J-Quants API search failed, using fallback:', apiError);
      
      // フォールバック: 人気銘柄から検索
      const filteredStocks = POPULAR_STOCKS.filter(stock => 
        stock.code.includes(query.toUpperCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );

      return NextResponse.json({
        results: filteredStocks,
        total: filteredStocks.length,
        query,
        fallback: true
      });
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
    );

    return NextResponse.json(results);

  } catch (error) {
    console.error('Batch search API error:', error);
    return NextResponse.json(
      { error: 'バッチ検索処理でエラーが発生しました' },
      { status: 500 }
    );
  }
}