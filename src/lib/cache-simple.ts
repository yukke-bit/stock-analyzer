import { StockInfo, AnalysisResult } from '@/types/stock';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlMinutes: number = 60): void {
    const now = Date.now();
    const expires = now + (ttlMinutes * 60 * 1000);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires
    });
    
    // メモリ使用量を制限するため古いエントリを削除
    this.cleanup();
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private cleanup(): void {
    if (this.cache.size <= 100) return; // 100エントリまでは許可
    
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // 期限切れのエントリを削除
    entries.forEach(([key, entry]) => {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    });
    
    // まだ多い場合は古いものから削除
    if (this.cache.size > 100) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, this.cache.size - 50);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }
  
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// シングルトンインスタンス
const cache = new SimpleCache();

export class DataCache {
  async saveStockData(symbol: string, data: StockInfo): Promise<void> {
    cache.set(`stock:${symbol}`, data, 360); // 6時間キャッシュ
  }

  async getStockData(symbol: string): Promise<StockInfo | null> {
    return cache.get<StockInfo>(`stock:${symbol}`);
  }

  async saveAnalysisResult(symbol: string, result: AnalysisResult): Promise<void> {
    cache.set(`analysis:${symbol}`, result, 60); // 1時間キャッシュ
  }

  async getAnalysisResult(symbol: string): Promise<AnalysisResult | null> {
    return cache.get<AnalysisResult>(`analysis:${symbol}`);
  }

  async listCachedStocks(): Promise<string[]> {
    const stats = cache.getStats();
    return stats.keys
      .filter(key => key.startsWith('stock:'))
      .map(key => key.replace('stock:', ''));
  }

  async clearOldCache(): Promise<void> {
    // SimpleCache内部で自動的にクリーンアップされるため、明示的な処理は不要
    console.log('Cache cleanup completed automatically');
  }
  
  getCacheStats() {
    return cache.getStats();
  }
}