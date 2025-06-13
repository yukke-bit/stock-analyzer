import { NextRequest, NextResponse } from 'next/server';
import { JQuantsAPI } from '@/lib/jquants';

const jquantsAPI = new JQuantsAPI();

export async function GET(request: NextRequest) {
  try {
    console.log('=== J-Quants API Debug Test ===');
    
    // 環境変数チェック
    const email = process.env.JQUANTS_EMAIL;
    const password = process.env.JQUANTS_PASSWORD;
    
    console.log('Environment variables:');
    console.log('JQUANTS_EMAIL:', email ? '✓ Set' : '✗ Not set');
    console.log('JQUANTS_PASSWORD:', password ? '✓ Set' : '✗ Not set');
    
    if (!email || !password) {
      return NextResponse.json({
        error: 'Environment variables not set',
        email: !!email,
        password: !!password
      }, { status: 500 });
    }

    // リフレッシュトークン取得テスト
    try {
      console.log('Testing refresh token acquisition...');
      const refreshToken = await (jquantsAPI as any).getRefreshToken();
      console.log('Refresh token successful, length:', refreshToken?.length || 0);
      
      // アクセストークン取得テスト
      console.log('Testing access token acquisition...');
      const accessToken = await (jquantsAPI as any).getAccessToken();
      console.log('Access token successful, length:', accessToken?.length || 0);
      
      // 少数の銘柄検索テスト
      console.log('Testing stock search...');
      const searchResults = await jquantsAPI.searchStocks('トヨタ');
      console.log('Search results count:', searchResults.length);
      console.log('First result:', searchResults[0]);
      
      // 個別API呼び出しテスト
      console.log('Testing individual API calls...');
      const apiTests = {
        prices: null as any,
        stockInfo: null as any,
        fundamentals: null as any
      };
      
      try {
        console.log('Testing getStockPrices...');
        apiTests.prices = await jquantsAPI.getStockPrices('7203');
        console.log('Stock prices successful, count:', apiTests.prices?.length || 0);
      } catch (priceError) {
        console.error('Stock prices failed:', priceError);
        apiTests.prices = { error: priceError instanceof Error ? priceError.message : 'Unknown error' };
      }
      
      try {
        console.log('Testing getStockInfo...');
        apiTests.stockInfo = await jquantsAPI.getStockInfo('7203');
        console.log('Stock info successful, name:', apiTests.stockInfo?.name);
      } catch (infoError) {
        console.error('Stock info failed:', infoError);
        apiTests.stockInfo = { error: infoError instanceof Error ? infoError.message : 'Unknown error' };
      }
      
      try {
        console.log('Testing getFundamentals...');
        apiTests.fundamentals = await jquantsAPI.getFundamentals('7203');
        console.log('Fundamentals successful, PER:', apiTests.fundamentals?.per);
      } catch (fundError) {
        console.error('Fundamentals failed:', fundError);
        apiTests.fundamentals = { error: fundError instanceof Error ? fundError.message : 'Unknown error' };
      }
      
      // 株価データ取得テスト結果を含める
      let stockDataTest = null;
      try {
        const stockData = await jquantsAPI.getStockData('7203');
        stockDataTest = {
          success: true,
          name: stockData.name,
          pricesCount: stockData.prices?.length || 0,
          firstPrice: stockData.prices?.[0] || null,
          fundamentals: stockData.fundamentals
        };
      } catch (stockError) {
        stockDataTest = {
          success: false,
          error: stockError instanceof Error ? stockError.message : 'Unknown error'
        };
      }

      return NextResponse.json({
        success: true,
        auth: {
          refreshTokenLength: refreshToken?.length || 0,
          accessTokenLength: accessToken?.length || 0
        },
        search: {
          query: 'トヨタ',
          resultsCount: searchResults.length,
          firstResult: searchResults[0] || null,
          allResults: searchResults
        },
        apiTests: {
          prices: apiTests.prices ? (apiTests.prices.error ? { error: apiTests.prices.error } : { success: true, count: apiTests.prices.length }) : null,
          stockInfo: apiTests.stockInfo ? (apiTests.stockInfo.error ? { error: apiTests.stockInfo.error } : { success: true, name: apiTests.stockInfo.name }) : null,
          fundamentals: apiTests.fundamentals ? (apiTests.fundamentals.error ? { error: apiTests.fundamentals.error } : { success: true, per: apiTests.fundamentals.per }) : null
        },
        stockData: stockDataTest,
        timestamp: new Date().toISOString()
      });
      
    } catch (authError) {
      console.error('Authentication or search failed:', authError);
      return NextResponse.json({
        error: 'J-Quants API call failed',
        message: authError instanceof Error ? authError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}