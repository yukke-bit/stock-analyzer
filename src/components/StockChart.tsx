'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { StockInfo } from '@/types/stock';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockChartProps {
  stockData: StockInfo;
}

export default function StockChart({ stockData }: StockChartProps) {
  const chartRef = useRef<ChartJS<'line', number[], string>>(null);

  const labels = stockData.prices.map(price => {
    const date = new Date(price.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: '株価',
        data: stockData.prices.map(price => price.close),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: '出来高 (×1000)',
        data: stockData.prices.map(price => price.volume / 1000),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 1,
        fill: false,
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 2,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          color: '#374151',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += `¥${context.parsed.y.toLocaleString()}`;
            } else {
              label += `${(context.parsed.y * 1000).toLocaleString()}`;
            }
            return label;
          },
          afterLabel: function(context: any) {
            if (context.datasetIndex === 0) {
              const price = stockData.prices[context.dataIndex];
              return [
                `始値: ¥${price.open.toLocaleString()}`,
                `高値: ¥${price.high.toLocaleString()}`,
                `安値: ¥${price.low.toLocaleString()}`,
                `出来高: ${price.volume.toLocaleString()}`
              ];
            }
            return '';
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '日付',
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '株価 (¥)',
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return `¥${value.toLocaleString()}`;
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '出来高 (×1000)',
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return `${value}K`;
          },
        },
      },
    },
  };

  // 価格変動の統計情報
  const latestPrice = stockData.prices[stockData.prices.length - 1];
  const oldestPrice = stockData.prices[0];
  const priceChange = latestPrice.close - oldestPrice.close;
  const priceChangePercent = (priceChange / oldestPrice.close) * 100;

  const highest = Math.max(...stockData.prices.map(p => p.high));
  const lowest = Math.min(...stockData.prices.map(p => p.low));

  return (
    <div className="space-y-4">
      {/* チャート */}
      <div className="h-80">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">期間変動</div>
          <div className={`font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}¥{priceChange.toLocaleString()}
          </div>
          <div className={`text-xs ${priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">期間高値</div>
          <div className="font-medium text-gray-900">¥{highest.toLocaleString()}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">期間安値</div>
          <div className="font-medium text-gray-900">¥{lowest.toLocaleString()}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">平均出来高</div>
          <div className="font-medium text-gray-900">
            {Math.round(stockData.prices.reduce((sum, p) => sum + p.volume, 0) / stockData.prices.length).toLocaleString()}
          </div>
        </div>
      </div>

      {/* データ期間 */}
      <div className="text-xs text-gray-500 text-center">
        データ期間: {stockData.prices[0]?.date} ～ {stockData.prices[stockData.prices.length - 1]?.date}
        ({stockData.prices.length}日間)
      </div>
    </div>
  );
}