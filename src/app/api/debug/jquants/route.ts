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

    // 認証テスト
    try {
      console.log('Testing authentication...');
      const token = await (jquantsAPI as any).authenticate();
      console.log('Authentication successful, token length:', token?.length || 0);
      
      // 少数の銘柄検索テスト
      console.log('Testing stock search...');
      const searchResults = await jquantsAPI.searchStocks('トヨタ');
      console.log('Search results count:', searchResults.length);
      console.log('First result:', searchResults[0]);
      
      return NextResponse.json({
        success: true,
        auth: {
          tokenLength: token?.length || 0
        },
        search: {
          query: 'トヨタ',
          resultsCount: searchResults.length,
          firstResult: searchResults[0] || null,
          allResults: searchResults
        },
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