"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createCoinbaseProvider, getGranularity } from './ChartDataProviders';

const ChartConfig = {
  priceLine: {
    width: 2,
    color: '#FF0000'
  },
  lineWidth: '3',
  lineColor: '#3DA5ED',
  fillColor: '#EAF5FD',
  backgroundColor: '#FFFFFF',
  context_padding: 50,
  grid: { 
    font: '12px Arial',      
    lineWidth: 0.3, 
    lineColor: '#A9A9A9',
    yearColor: 'red',
    monthColor: 'green',
    dayColor: 'blue',
  },
  priceArrow: { 
    fillCollor: '#3DA5ED', 
    priceColor: '#FFFFFF' 
  },
  interaction: { 
    scrollingSpeed: 42 
  },
  tooltip: {
    background: 'rgba(0,0,0,0.5)',
    textColor: '#FFFFFF',
    padding: 4,
    borderRadius: 4,
    font: '12px Arial',
  },
  volumeChart: {
    barColor: 'rgba(165, 214, 255, 0.8)',
    barColorDown: 'rgba(255, 158, 158, 0.8)',
    barSpacing: 1,
    height: 100,
    padding: 5
  }
};

const TimeframeButton = ({ timeframe, active, onClick }) => (
  <button 
    onClick={() => onClick(timeframe)}
    className={`px-4 py-2 mx-1 rounded ${active ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    {timeframe}
  </button>
);

const OpenChart = ({ 
  symbol = 'ETH-USD', 
  height = 350, 
  width = 750,
  dataProvider = createCoinbaseProvider()
}) => {
  const canvasRef = useRef(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastPrice, setLastPrice] = useState(null);
  
  const timeframes = ['1H', '1D', '5D', '1M', '3M', '6M', 'YTD', '1Y'];

  const getTimeRange = (timeframe) => {
    const end = new Date();
    const start = new Date();
    
    switch(timeframe) {
      case '1H':
        start.setHours(end.getHours() - 1);
        break;
      case '1D':
        start.setDate(end.getDate() - 1);
        break;
      case '5D':
        start.setDate(end.getDate() - 5);
        break;
      case '1M':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(end.getMonth() - 6);
        break;
      case 'YTD':
        start.setMonth(0, 1);
        break;
      case '1Y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  };

  const fetchData = async (timeframe) => {
    setLoading(true);
    try {
      const { start, end } = getTimeRange(timeframe);
      const granularity = getGranularity(timeframe);
      const data = await dataProvider.fetchCandles(symbol, start, end, granularity);
      setChartData(data);
      if (data.length > 0) {
        setLastPrice(data[data.length - 1].close);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawChart = () => {
    if (!canvasRef.current || chartData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const padding = ChartConfig.context_padding;
    
    // Clear canvas
    ctx.fillStyle = ChartConfig.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate price range
    const prices = chartData.map(d => d.close);
    const minPrice = Math.min(...prices) * 0.99;
    const maxPrice = Math.max(...prices) * 1.01;
    const priceRange = maxPrice - minPrice;

    // Calculate scales
    const xScale = (width - padding * 2) / (chartData.length - 1);
    const yScale = (height - padding * 2) / priceRange;

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = ChartConfig.lineColor;
    ctx.lineWidth = ChartConfig.lineWidth;

    chartData.forEach((point, i) => {
      const x = padding + i * xScale;
      const y = height - padding - (point.close - minPrice) * yScale;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();


    // Fill area under line
    ctx.lineTo(padding + (chartData.length - 1) * xScale, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.fillStyle = ChartConfig.fillColor;
    ctx.fill();

    // Draw last price
    if (lastPrice) {
      const y = height - padding - (lastPrice - minPrice) * yScale;
      ctx.beginPath();
      ctx.arc(width - padding, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = ChartConfig.lineColor;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  useEffect(() => {
    fetchData(activeTimeframe);

    // Subscribe to real-time updates
    /*
    const unsubscribe = dataProvider.subscribeToUpdates(symbol, (update) => {
      setLastPrice(update.price);
    });
    */

    return () => {
      // unsubscribe();
      // dataProvider.unsubscribe();
    };
  }, [activeTimeframe, symbol]);

  useEffect(() => {
    drawChart();
  }, [chartData, lastPrice]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading chart...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl p-4">
      <div className="flex space-x-2 mb-4">
        {timeframes.map(tf => (
          <TimeframeButton
            key={tf}
            timeframe={tf}
            active={activeTimeframe === tf}
            onClick={setActiveTimeframe}
          />
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg"
      />
    </div>
  );
};

export default OpenChart;