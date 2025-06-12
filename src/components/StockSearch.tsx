'use client';

import { useState, useEffect, useRef } from 'react';

interface Stock {
  symbol: string;
  name: string;
}

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
}

export default function StockSearch({ onSelectStock }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 1) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const stocks = await response.json();
          setSuggestions(stocks);
          setIsOpen(stocks.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchStocks, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectStock = (symbol: string) => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onSelectStock(symbol);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstSuggestion = suggestionRefs.current[0];
      if (firstSuggestion) {
        firstSuggestion.focus();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent, index: number, symbol: string) => {
    if (e.key === 'Enter') {
      handleSelectStock(symbol);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextSuggestion = suggestionRefs.current[index + 1];
      if (nextSuggestion) {
        nextSuggestion.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        inputRef.current?.focus();
      } else {
        const prevSuggestion = suggestionRefs.current[index - 1];
        if (prevSuggestion) {
          prevSuggestion.focus();
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  const popularStocks = [
    { symbol: '7203', name: 'トヨタ自動車' },
    { symbol: '9984', name: 'ソフトバンクグループ' },
    { symbol: '6098', name: 'リクルートホールディングス' },
    { symbol: '6861', name: 'キーエンス' },
    { symbol: '7974', name: '任天堂' },
    { symbol: '6758', name: 'ソニーグループ' }
  ];

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">銘柄検索</h2>
        
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="銘柄名または銘柄コードを入力..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* 検索結果ドロップダウン */}
          {isOpen && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((stock, index) => (
                <li
                  key={stock.symbol}
                  ref={(el) => { suggestionRefs.current[index] = el; }}
                  tabIndex={0}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectStock(stock.symbol)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, index, stock.symbol)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{stock.name}</div>
                      <div className="text-sm text-gray-500">{stock.symbol}</div>
                    </div>
                    <div className="text-blue-600">
                      →
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 人気銘柄 */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">人気銘柄</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {popularStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelectStock(stock.symbol)}
                className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-medium text-sm text-gray-900">{stock.name}</div>
                <div className="text-xs text-gray-500">{stock.symbol}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}