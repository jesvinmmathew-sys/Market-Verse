import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string; // e.g., "ICICIBANK" or "NSE:ICICIBANK"
  theme?: 'dark' | 'light';
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol = 'ICICIBANK',
  theme = 'dark',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Normalize Indian Stock Symbol
    let cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol.includes(':')) {
      if (cleanSymbol === 'EURUSD' || cleanSymbol === 'USDINR') {
        cleanSymbol = `FX_IDC:${cleanSymbol}`;
      } else {
        cleanSymbol = `NSE:${cleanSymbol}`;
      }
    }

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.id = 'tv_chart_container';
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

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
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
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
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0d131f]"
      style={{ height: '560px', width: '100%' }}
    />
  );
};

export default memo(TradingViewWidget);
