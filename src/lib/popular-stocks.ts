// 日本の主要銘柄データベース（API呼び出し不要）
export interface PopularStock {
  code: string;
  name: string;
  sector: string;
  market: string;
  keywords: string[]; // 検索用キーワード
}

export const POPULAR_STOCKS: PopularStock[] = [
  // 大型株（時価総額上位）
  { code: '7203', name: 'トヨタ自動車', sector: '輸送用機器', market: 'プライム', keywords: ['トヨタ', 'toyota', '自動車', 'car'] },
  { code: '6758', name: 'ソニーグループ', sector: '電気機器', market: 'プライム', keywords: ['ソニー', 'sony', '電気', '家電', 'ゲーム'] },
  { code: '9984', name: 'ソフトバンクグループ', sector: '情報・通信業', market: 'プライム', keywords: ['ソフトバンク', 'softbank', '通信', 'IT'] },
  { code: '7974', name: '任天堂', sector: 'その他製品', market: 'プライム', keywords: ['任天堂', 'nintendo', 'ゲーム', 'game'] },
  { code: '6861', name: 'キーエンス', sector: '電気機器', market: 'プライム', keywords: ['キーエンス', 'keyence', 'センサー'] },
  { code: '8035', name: '東京エレクトロン', sector: '電気機器', market: 'プライム', keywords: ['東京エレクトロン', '半導体', 'semiconductor'] },
  { code: '4063', name: '信越化学工業', sector: '化学', market: 'プライム', keywords: ['信越化学', '化学', 'chemical'] },
  { code: '9434', name: 'ソフトバンク', sector: '情報・通信業', market: 'プライム', keywords: ['ソフトバンク', 'softbank', '通信', '携帯'] },
  
  // 銀行・金融
  { code: '8306', name: '三菱UFJフィナンシャル・グループ', sector: '銀行業', market: 'プライム', keywords: ['三菱UFJ', 'MUFG', '銀行', 'bank', '金融'] },
  { code: '8316', name: '三井住友フィナンシャルグループ', sector: '銀行業', market: 'プライム', keywords: ['三井住友', 'SMFG', '銀行', 'bank'] },
  { code: '8411', name: 'みずほフィナンシャルグループ', sector: '銀行業', market: 'プライム', keywords: ['みずほ', '銀行', 'bank'] },
  
  // 商社
  { code: '8058', name: '三菱商事', sector: '卸売業', market: 'プライム', keywords: ['三菱商事', '商事', '商社', 'trading'] },
  { code: '8001', name: '伊藤忠商事', sector: '卸売業', market: 'プライム', keywords: ['伊藤忠', '商事', '商社'] },
  { code: '2914', name: '日本たばこ産業', sector: 'その他製品', market: 'プライム', keywords: ['JT', 'たばこ', 'tobacco'] },
  
  // 小売・EC
  { code: '9983', name: 'ファーストリテイリング', sector: '小売業', market: 'プライム', keywords: ['ファーストリテイリング', 'ユニクロ', 'uniqlo', '小売'] },
  { code: '4755', name: '楽天グループ', sector: 'サービス業', market: 'プライム', keywords: ['楽天', 'rakuten', 'EC', 'ネット'] },
  { code: '4385', name: 'メルカリ', sector: 'サービス業', market: 'プライム', keywords: ['メルカリ', 'mercari', 'フリマ'] },
  
  // IT・インターネット
  { code: '4689', name: 'Zホールディングス', sector: '情報・通信業', market: 'プライム', keywords: ['Z', 'yahoo', 'ヤフー', 'IT'] },
  { code: '6098', name: 'リクルートホールディングス', sector: 'サービス業', market: 'プライム', keywords: ['リクルート', 'recruit', '人材'] },
  { code: '3659', name: 'ネクソン', sector: '情報・通信業', market: 'プライム', keywords: ['ネクソン', 'nexon', 'ゲーム'] },
  { code: '2432', name: 'ディー・エヌ・エー', sector: 'サービス業', market: 'プライム', keywords: ['DeNA', 'DNA', 'ゲーム', 'IT'] },
  
  // 製薬・ヘルスケア
  { code: '4568', name: '第一三共', sector: '医薬品', market: 'プライム', keywords: ['第一三共', '製薬', 'pharma'] },
  { code: '4519', name: '中外製薬', sector: '医薬品', market: 'プライム', keywords: ['中外製薬', '製薬', 'pharma'] },
  { code: '8031', name: 'テルモ', sector: '精密機器', market: 'プライム', keywords: ['テルモ', '医療機器', 'medical'] },
  
  // インフラ・エネルギー
  { code: '9432', name: '日本電信電話', sector: '情報・通信業', market: 'プライム', keywords: ['NTT', '電信電話', '通信', 'telecom'] },
  { code: '6178', name: '日本郵政', sector: 'サービス業', market: 'プライム', keywords: ['日本郵政', '郵政', 'post'] },
  { code: '9101', name: '日本郵船', sector: '海運業', market: 'プライム', keywords: ['日本郵船', '海運', 'shipping'] },
  
  // 製造業
  { code: '6954', name: 'ファナック', sector: '電気機器', market: 'プライム', keywords: ['ファナック', 'fanuc', '工作機械'] },
  { code: '6367', name: 'ダイキン工業', sector: '機械', market: 'プライム', keywords: ['ダイキン', 'daikin', 'エアコン'] },
  { code: '7751', name: 'キヤノン', sector: '電気機器', market: 'プライム', keywords: ['キヤノン', 'canon', 'カメラ'] },
  { code: '4452', name: '花王', sector: '化学', market: 'プライム', keywords: ['花王', 'kao', '日用品', 'cosmetics'] },
  { code: '4901', name: '富士フイルムホールディングス', sector: '化学', market: 'プライム', keywords: ['富士フイルム', 'fujifilm', 'フィルム'] },
  
  // 半導体・電子部品
  { code: '6857', name: 'アドバンテスト', sector: '電気機器', market: 'プライム', keywords: ['アドバンテスト', '半導体', 'test'] },
  { code: '6594', name: '日本電産', sector: '電気機器', market: 'プライム', keywords: ['日本電産', 'nidec', 'モーター'] },
  { code: '3436', name: 'SUMCO', sector: '金属製品', market: 'プライム', keywords: ['SUMCO', 'sumco', '半導体', 'シリコン'] },
];

// 検索用のユーティリティ関数
export function searchPopularStocks(query: string, limit: number = 20): PopularStock[] {
  const searchQuery = query.toLowerCase();
  
  return POPULAR_STOCKS.filter(stock => {
    return (
      stock.code.includes(searchQuery.toUpperCase()) ||
      stock.name.toLowerCase().includes(searchQuery) ||
      stock.sector.toLowerCase().includes(searchQuery) ||
      stock.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
    );
  }).slice(0, limit);
}

// セクター別検索
export function getStocksBySector(sector: string): PopularStock[] {
  return POPULAR_STOCKS.filter(stock => 
    stock.sector.includes(sector)
  );
}

// 全セクター一覧
export function getAllSectors(): string[] {
  return Array.from(new Set(POPULAR_STOCKS.map(stock => stock.sector)));
}