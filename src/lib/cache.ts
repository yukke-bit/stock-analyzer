import fs from 'fs-extra';
import path from 'path';
import { StockInfo, AnalysisResult } from '@/types/stock';

export class DataCache {
  private cacheDir = path.join(process.cwd(), 'data');

  constructor() {
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    fs.ensureDirSync(this.cacheDir);
  }

  async saveStockData(symbol: string, data: StockInfo): Promise<void> {
    const filePath = path.join(this.cacheDir, `${symbol}.json`);
    await fs.writeJson(filePath, {
      ...data,
      cachedAt: new Date().toISOString()
    }, { spaces: 2 });
  }

  async getStockData(symbol: string): Promise<StockInfo | null> {
    try {
      const filePath = path.join(this.cacheDir, `${symbol}.json`);
      const exists = await fs.pathExists(filePath);
      
      if (!exists) return null;

      const data = await fs.readJson(filePath);
      const cachedAt = new Date(data.cachedAt);
      const now = new Date();
      const hoursSinceCache = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

      // 6時間以内のキャッシュのみ使用
      if (hoursSinceCache < 6) {
        const { cachedAt, ...stockData } = data;
        return stockData as StockInfo;
      }

      return null;
    } catch (error) {
      console.error(`Error reading cache for ${symbol}:`, error);
      return null;
    }
  }

  async saveAnalysisResult(symbol: string, result: AnalysisResult): Promise<void> {
    const filePath = path.join(this.cacheDir, `analysis_${symbol}.json`);
    await fs.writeJson(filePath, result, { spaces: 2 });
  }

  async getAnalysisResult(symbol: string): Promise<AnalysisResult | null> {
    try {
      const filePath = path.join(this.cacheDir, `analysis_${symbol}.json`);
      const exists = await fs.pathExists(filePath);
      
      if (!exists) return null;

      const result = await fs.readJson(filePath);
      const updatedAt = new Date(result.updatedAt);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

      // 1時間以内の分析結果のみ使用
      if (hoursSinceUpdate < 1) {
        return result as AnalysisResult;
      }

      return null;
    } catch (error) {
      console.error(`Error reading analysis cache for ${symbol}:`, error);
      return null;
    }
  }

  async listCachedStocks(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files
        .filter(file => file.endsWith('.json') && !file.startsWith('analysis_'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error listing cached stocks:', error);
      return [];
    }
  }

  async clearOldCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = new Date();

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        const hoursSinceModified = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60);

        // 24時間以上古いファイルを削除
        if (hoursSinceModified > 24) {
          await fs.remove(filePath);
          console.log(`Removed old cache file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error clearing old cache:', error);
    }
  }
}