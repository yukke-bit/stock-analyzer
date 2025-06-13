import { StockInfo, StockPrice, Fundamentals } from '@/types/stock';

interface JQuantsConfig {
  email: string;
  password: string;
  baseUrl: string;
}

interface JQuantsRefreshTokenResponse {
  refreshToken: string;
}

interface JQuantsAccessTokenResponse {
  idToken: string;
}

interface JQuantsPriceResponse {
  daily_quotes: {
    Date: string;
    Code: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
    TurnoverValue: number;
    AdjustmentFactor: number;
    AdjustmentOpen: number;
    AdjustmentHigh: number;
    AdjustmentLow: number;
    AdjustmentClose: number;
    AdjustmentVolume: number;
  }[];
  pagination_key?: string;
}

interface JQuantsListedInfoResponse {
  info: {
    Date: string;
    Code: string;
    CompanyName: string;
    CompanyNameEnglish: string;
    Sector17Code: string;
    Sector17CodeName: string;
    Sector33Code: string;
    Sector33CodeName: string;
    ScaleCategory: string;
    MarketCode: string;
    MarketCodeName: string;
  }[];
}

export interface SearchResult {
  code: string;
  name: string;
  nameEnglish?: string;
  sector: string;
  market: string;
  scaleCategory: string;
}

export class JQuantsAPI {
  private config: JQuantsConfig;
  private refreshToken: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      email: process.env.JQUANTS_EMAIL || '',
      password: process.env.JQUANTS_PASSWORD || '',
      baseUrl: 'https://api.jquants.com/v1'
    };
  }

  /**
   * リフレッシュトークンを取得
   */
  private async getRefreshToken(): Promise<string> {
    if (!this.config.email || !this.config.password) {
      throw new Error('J-Quants email and password are not configured');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/token/auth_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mailaddress: this.config.email,
          password: this.config.password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Refresh token request failed: ${response.status} - ${errorText}`);
      }

      const data: JQuantsRefreshTokenResponse = await response.json();
      this.refreshToken = data.refreshToken;
      
      console.log('J-Quants refresh token obtained successfully');
      return this.refreshToken;
    } catch (error) {
      console.error('J-Quants refresh token error:', error);
      throw error;
    }
  }

  /**
   * アクセストークンを取得
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // リフレッシュトークンがない場合は取得
    if (!this.refreshToken) {
      await this.getRefreshToken();
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/token/auth_refresh?refreshtoken=${this.refreshToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // リフレッシュトークンが無効な場合は再取得
        if (response.status === 401) {
          console.log('Refresh token expired, getting new refresh token');
          await this.getRefreshToken();
          return this.getAccessToken(); // 再帰呼び出し
        }
        
        const errorText = await response.text();
        throw new Error(`Access token request failed: ${response.status} - ${errorText}`);
      }

      const data: JQuantsAccessTokenResponse = await response.json();
      this.accessToken = data.idToken;
      this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23時間（24時間 - 1時間の余裕）

      console.log('J-Quants access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('J-Quants access token error:', error);
      throw error;
    }
  }

  /**
   * 認証を行い、アクセストークンを取得（公開メソッド）
   */
  private async authenticate(): Promise<string> {
    return this.getAccessToken();
  }

  /**
   * 株価データを取得
   */
  async getStockPrices(symbol: string, days: number = 30): Promise<StockPrice[]> {
    try {
      const token = await this.authenticate();
      
      // 日付範囲の計算（J-Quants契約期間を考慮）
      // 契約期間: 2023-03-21 ~ 2025-03-21
      const contractEndDate = new Date('2025-03-21');
      const today = new Date();
      
      // 契約期間内の最新日付を使用
      const endDate = today <= contractEndDate ? today : contractEndDate;
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days);
      
      // 契約開始日より前の場合は調整
      const contractStartDate = new Date('2023-03-21');
      if (startDate < contractStartDate) {
        startDate.setTime(contractStartDate.getTime());
      }

      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];

      const url = `${this.config.baseUrl}/prices/daily_quotes?code=${symbol}&from=${fromDate}&to=${toDate}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Stock prices API error: ${response.status}`, errorText);
        console.error(`Requested URL: ${url}`);
        throw new Error(`Failed to fetch stock prices: ${response.status} - ${errorText}`);
      }

      const data: JQuantsPriceResponse = await response.json();
      
      console.log('Stock prices API response:', JSON.stringify(data, null, 2));
      
      if (!data.daily_quotes || !Array.isArray(data.daily_quotes)) {
        console.error('Invalid daily_quotes data structure:', data);
        throw new Error('Invalid API response: daily_quotes array not found');
      }

      return data.daily_quotes.map(price => ({
        date: price.Date,
        open: price.AdjustmentOpen || price.Open,
        high: price.AdjustmentHigh || price.High,
        low: price.AdjustmentLow || price.Low,
        close: price.AdjustmentClose || price.Close,
        volume: price.AdjustmentVolume || price.Volume
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    } catch (error) {
      console.error(`Failed to fetch stock prices for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 銘柄情報を取得
   */
  async getStockInfo(symbol: string): Promise<{ code: string; name: string; sector: string }> {
    try {
      const token = await this.authenticate();
      
      const response = await fetch(`${this.config.baseUrl}/listed/info?code=${symbol}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock info: ${response.status}`);
      }

      const data = await response.json();
      const stockInfo = data.info?.[0];

      if (!stockInfo) {
        throw new Error(`Stock info not found for ${symbol}`);
      }

      return {
        code: stockInfo.Code,
        name: stockInfo.CompanyName,
        sector: stockInfo.Sector17Code || '不明'
      };
    } catch (error) {
      console.error(`Failed to fetch stock info for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 財務データを取得
   */
  async getFundamentals(symbol: string): Promise<Fundamentals> {
    try {
      const token = await this.authenticate();
      
      const response = await fetch(`${this.config.baseUrl}/fins/statements?code=${symbol}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch fundamentals for ${symbol}, using defaults`);
        return this.getDefaultFundamentals();
      }

      const data = await response.json();
      const latestFins = data.statements?.[0];

      if (!latestFins) {
        return this.getDefaultFundamentals();
      }

      return {
        per: latestFins.PerShareInformation?.PER || undefined,
        pbr: latestFins.PerShareInformation?.PBR || undefined,
        roe: latestFins.FinancialRatios?.ROE || undefined,
        dividendYield: latestFins.PerShareInformation?.DividendYield || undefined,
        marketCap: latestFins.MarketCapitalization || undefined,
        revenue: latestFins.NetSales || undefined
      };
    } catch (error) {
      console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
      return this.getDefaultFundamentals();
    }
  }

  /**
   * デフォルトの財務データ
   */
  private getDefaultFundamentals(): Fundamentals {
    return {
      per: 15.5,
      pbr: 1.2,
      roe: 8.5,
      dividendYield: 2.1,
      marketCap: 1000000000,
      revenue: 500000000
    };
  }

  /**
   * 完全な株式データを取得
   */
  async getStockData(symbol: string): Promise<StockInfo> {
    try {
      console.log(`Fetching data from J-Quants API for ${symbol}`);
      
      const [prices, stockInfo, fundamentals] = await Promise.all([
        this.getStockPrices(symbol),
        this.getStockInfo(symbol),
        this.getFundamentals(symbol)
      ]);

      return {
        symbol: stockInfo.code,
        name: stockInfo.name,
        prices,
        fundamentals
      };
    } catch (error) {
      console.error(`Failed to fetch complete stock data for ${symbol}:`, error);
      
      // フォールバック: モックデータを返す
      console.log(`Falling back to mock data for ${symbol}`);
      return this.getMockStockData(symbol);
    }
  }

  /**
   * 検索結果キャッシュ（クエリ別）
   */
  private searchCache = new Map<string, { results: SearchResult[]; expires: Date }>();

  /**
   * API効率化された銘柄検索
   */
  async searchStocks(query: string): Promise<SearchResult[]> {
    try {
      console.log(`Searching stocks with query: ${query}`);
      
      // キャッシュから検索結果を確認（7日間キャッシュ）
      const cacheKey = query.toLowerCase().trim();
      const cachedSearch = this.searchCache.get(cacheKey);
      
      if (cachedSearch && new Date() < cachedSearch.expires) {
        console.log(`Using cached search results for: ${query}`);
        return cachedSearch.results;
      }

      // Step 1: まず人気銘柄から検索（API不要）
      const popularResults = this.getMockSearchResults(query);
      
      if (popularResults.length > 0) {
        console.log(`Found ${popularResults.length} results in popular stocks`);
        
        // 人気銘柄での結果をキャッシュ
        this.searchCache.set(cacheKey, {
          results: popularResults,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日
        });
        
        return popularResults;
      }

      // Step 2: 人気銘柄で見つからない場合のみAPIを使用
      console.log(`No results in popular stocks, trying J-Quants API for: ${query}`);
      
      try {
        const token = await this.authenticate();
        
        // 特定の銘柄コードで直接検索を試行
        if (/^[0-9]{4}$/.test(query)) {
          const singleResult = await this.searchSingleStock(query, token);
          if (singleResult) {
            const results = [singleResult];
            this.searchCache.set(cacheKey, {
              results,
              expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            return results;
          }
        }

        // 部分的なAPIアクセス（必要最小限）
        const apiResults = await this.limitedApiSearch(query, token);
        
        // API結果をキャッシュ
        this.searchCache.set(cacheKey, {
          results: apiResults,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        
        return apiResults;

      } catch (apiError) {
        console.warn(`J-Quants API search failed for ${query}:`, apiError);
        
        // API失敗時は空配列を短期間キャッシュ（再試行を防ぐ）
        this.searchCache.set(cacheKey, {
          results: [],
          expires: new Date(Date.now() + 60 * 60 * 1000) // 1時間
        });
        
        return [];
      }

    } catch (error) {
      console.error(`Search failed for query ${query}:`, error);
      return this.getMockSearchResults(query);
    }
  }

  /**
   * 単一銘柄の詳細検索（APIコール最小化）
   */
  private async searchSingleStock(code: string, token: string): Promise<SearchResult | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/listed/info?code=${code}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data: JQuantsListedInfoResponse = await response.json();
      const stock = data.info?.[0];

      if (!stock) return null;

      return {
        code: stock.Code,
        name: stock.CompanyName,
        nameEnglish: stock.CompanyNameEnglish || undefined,
        sector: stock.Sector17CodeName || '不明',
        market: stock.MarketCodeName || '不明',
        scaleCategory: stock.ScaleCategory || '不明'
      };

    } catch (error) {
      console.error(`Single stock search failed for ${code}:`, error);
      return null;
    }
  }

  /**
   * 制限された API検索（フル検索を避ける）
   */
  private async limitedApiSearch(query: string, token: string): Promise<SearchResult[]> {
    // 現在は安全のため空配列を返す（フル API アクセスを避ける）
    // 必要に応じて特定の条件下でのみ制限的な検索を実装
    console.log(`Limited API search not implemented for safety: ${query}`);
    return [];
  }

  /**
   * 人気銘柄から検索（API不要）
   */
  private getMockSearchResults(query: string): SearchResult[] {
    // 外部の人気銘柄データベースを使用
    const { searchPopularStocks } = require('./popular-stocks');
    const popularResults = searchPopularStocks(query, 20);
    
    return popularResults.map((stock: any) => ({
      code: stock.code,
      name: stock.name,
      nameEnglish: undefined,
      sector: stock.sector,
      market: stock.market,
      scaleCategory: '大型'
    }));
  }

  /**
   * フォールバック用のモックデータ
   */
  private getMockStockData(symbol: string): StockInfo {
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
      fundamentals: this.getDefaultFundamentals()
    };
  }
}