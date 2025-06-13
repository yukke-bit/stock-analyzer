import { StockInfo, StockPrice, Fundamentals } from '@/types/stock';

interface JQuantsConfig {
  email: string;
  password: string;
  baseUrl: string;
}

interface JQuantsRefreshTokenResponse {
  refresh_token: string;
}

interface JQuantsAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface JQuantsPriceResponse {
  prices: {
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
      this.refreshToken = data.refresh_token;
      
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
      const response = await fetch(`${this.config.baseUrl}/token/auth_refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
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
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // 60秒の余裕を持たせる

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
      
      // 日付範囲の計算
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

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
        throw new Error(`Failed to fetch stock prices: ${response.status}`);
      }

      const data: JQuantsPriceResponse = await response.json();

      return data.prices.map(price => ({
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