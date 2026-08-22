import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'NSE:NIFTY',
  theme = 'dark',
  height = 580,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Normalize Indian stock symbols
    let cleanSymbol = (symbol || 'NIFTY').trim().toUpperCase();
    if (!cleanSymbol.includes(':')) {
      if (cleanSymbol === 'EURUSD' || cleanSymbol === 'USDINR') {
        cleanSymbol = `FX_IDC:${cleanSymbol}`;
      } else {
        cleanSymbol = `NSE:${cleanSymbol}`;
      }
    }

    const container = containerRef.current;
    if (!container) return;

    // 2. Clear old widget elements before mounting to avoid DOM race conditions
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.id = 'tv_chart_container';
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    // 3. Create and append external embed script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: cleanSymbol,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: theme,
      style: '1',
      locale: 'in',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: false,
      studies: [
        'RSI@tv-basicstudies',
        'MASimple@tv-basicstudies'
      ],
      container_id: 'tv_chart_container'
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0d131f] shadow-2xl">
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full"
        style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '520px', width: '100%' }}
      />
    </div>
  );
};

export default memo(TradingViewChart);
