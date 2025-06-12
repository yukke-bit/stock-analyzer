import { NextRequest, NextResponse } from 'next/server';

// 日本の主要株式銘柄リスト（サンプル）
const JAPANESE_STOCKS = [
  { symbol: '7203', name: 'トヨタ自動車' },
  { symbol: '9984', name: 'ソフトバンクグループ' },
  { symbol: '6098', name: 'リクルートホールディングス' },
  { symbol: '8035', name: '東京エレクトロン' },
  { symbol: '6861', name: 'キーエンス' },
  { symbol: '4063', name: '信越化学工業' },
  { symbol: '9432', name: '日本電信電話' },
  { symbol: '8306', name: '三菱UFJフィナンシャル・グループ' },
  { symbol: '7974', name: '任天堂' },
  { symbol: '6178', name: '日本郵政' },
  { symbol: '2914', name: '日本たばこ産業' },
  { symbol: '8031', name: 'テルモ' },
  { symbol: '4519', name: '中外製薬' },
  { symbol: '6954', name: 'ファナック' },
  { symbol: '8001', name: '伊藤忠商事' },
  { symbol: '9101', name: '日本郵船' },
  { symbol: '6857', name: 'アドバンテスト' },
  { symbol: '4452', name: '花王' },
  { symbol: '7751', name: 'キヤノン' },
  { symbol: '6758', name: 'ソニーグループ' },
  { symbol: '4568', name: '第一三共' },
  { symbol: '8058', name: '三菱商事' },
  { symbol: '4901', name: '富士フイルムホールディングス' },
  { symbol: '3659', name: 'ネクソン' },
  { symbol: '4755', name: '楽天グループ' },
  { symbol: '2432', name: 'ディー・エヌ・エー' },
  { symbol: '4385', name: 'メルカリ' },
  { symbol: '3436', name: 'SUMCO' },
  { symbol: '6594', name: '日本電産' },
  { symbol: '6367', name: 'ダイキン工業' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(JAPANESE_STOCKS.slice(0, 10));
    }

    // 銘柄名または銘柄コードで検索
    const filtered = JAPANESE_STOCKS.filter(stock => 
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      stock.symbol.includes(query)
    );

    return NextResponse.json(filtered.slice(0, 10));

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: '検索処理でエラーが発生しました' },
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

    const results = JAPANESE_STOCKS.filter(stock => 
      symbols.includes(stock.symbol)
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