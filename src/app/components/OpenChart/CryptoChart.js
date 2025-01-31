// components/CryptoChart.jsx
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import CoinbaseDataConnector from './hooks/CoinbaseDataConnector';
import DateHelper from './utils/DateHelper';

const CryptoChart = ({ symbol, timeframe, granularity }) => {
  const canvasRef = useRef(null);
  //const [ctx, setCtx] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  //const [offset, setOffset] = useState({ start: 0, end: 0, fstart: 0, fend: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  // const { chartData, loading, error } = useCoinbaseData(symbol, timeframe, granularity);
  //const dateHelper = useDateHelper();

  const { chartData, loading, error, fetchChartData } = CoinbaseDataConnector();


  let offset = { 'start': 0, 'end': 0, 'fstart': 0.0, 'fend': 0.0 };
  let fetchedDataOffset = { 'start': 0, 'end': 0 }

  var apiGranularity = null;
  var startPeriod = null;
  var symbolData = { 
    'symbol': '' 
  };
  let mouseDown = false;
  //var chartData = {};
  var context_height = 0.0
  var context_width = 0.0
  var ctx;
  var min = 10000.0, max = 0.0
  var dragChart = false;
  var clientX;
  var lstPrice = 0.0;
  var whellKinetic = 0.0;
  var kineticZoomInterval = null;
  var kineticDragInterval = null;
  var kineticDragVelocity = 0.0;
  var lastDragDirection = 0.0;
  var _destX = 0.0
  var _kineticSpeed = 0.0
  var _kineticCount = 0.0
  var _kineticMouseWhellSpeed = 0.0
  var _kineticMouseWhellcount = 0.0
  var _time1 = new Date().getTime()
  var _horizontalDragResidualSpeedTimer = null

  // Interaction handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const delta = dragStart - e.clientX;
      setOffset(prev => ({
        start: Math.min(prev.start + delta, chartData.length - 1),
        end: Math.max(prev.end - delta, 0)
      }));
      setDragStart(e.clientX);
    } else {
      const dataIndex = Math.floor((x / dimensions.width) * chartData.length);
      setTooltip({
        visible: true,
        x,
        y,
        data: chartData[dataIndex]
      });
    }
  }, [isDragging, dragStart, dimensions, chartData]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
  }

  var requestChartForTimeFrame = function (symbol, timeFrame, granularity, attachEvents, onComplete) {

    //cleanup();

    // Reset zoom/offset values
    offset = { 'start': 0, 'end': 0, 'fstart': 0.0, 'fend': 0.0 };
    fetchedDataOffset = { 'start': 0, 'end': 0 };

    symbolData.symbol = symbol;
    // var dateHelper = DateHelper();
    var today = new Date();

    // Supported Coinbase granularities in seconds
    const GRANULARITY = {
      ONE_MINUTE: 60,
      FIVE_MINUTES: 300,
      FIFTEEN_MINUTES: 900,
      ONE_HOUR: 3600,
      SIX_HOURS: 21600,
      ONE_DAY: 86400
    };

    timeFrame = timeFrame || ''
    switch (timeFrame.toLowerCase()) {
      case '1y':
        // apiGranularity = granularity || '1D'
        apiGranularity = granularity || GRANULARITY.ONE_DAY;
        startPeriod = dateHelper.getPastDateFromDate(today, 365)
        break
      case '6m':
        // apiGranularity = granularity || '1D'
        apiGranularity = granularity || GRANULARITY.ONE_DAY;
        startPeriod = dateHelper.getPastDateFromDate(today, 365 / 2);
        break
      case '3m':
        // apiGranularity = granularity || '1D'
        apiGranularity = granularity || GRANULARITY.SIX_HOURS;
        startPeriod = dateHelper.getPastDateFromDate(today, 30 * 3);
        break
      case '1m':
        // apiGranularity = granularity || '1H'
        apiGranularity = granularity || GRANULARITY.ONE_HOUR;
        startPeriod = dateHelper.getPastDateFromDate(today, 30);
        break
      case '5d':
        // apiGranularity = granularity || '10M'
        apiGranularity = granularity || GRANULARITY.FIFTEEN_MINUTES;
        startPeriod = dateHelper.getPastDateFromDate(today, 5);
        break
      case '1d':
        // apiGranularity = granularity || '1M'
        apiGranularity = granularity || GRANULARITY.FIVE_MINUTES;
        startPeriod = DateHelper.getPastDateFromDate(today, 0);
        break
      case '1h':
        // apiGranularity = granularity || '1M'
        apiGranularity = granularity || GRANULARITY.ONE_MINUTE;
        startPeriod = dateHelper.getPastHourFromDate(today, 1); // 1 hour ago
        break
      default:
        apiGranularity = GRANULARITY.ONE_HOUR;
        apiGranularity = GRANULARITY.ONE_HOUR;
        startPeriod = dateHelper.getPastDateFromDate(today, 30);

    }
    // Override with custom granularity if provided and valid
    if (granularity) {
      // Convert string granularity to seconds if needed
      const granularityInSeconds = parseInt(granularity);
      if ([60, 300, 900, 3600, 21600, 86400].includes(granularityInSeconds)) {
        apiGranularity = granularityInSeconds;
      } else {
        console.warn('Invalid granularity provided, using default for timeframe');
      }
    }

    _requestChartForPeriod(symbol, startPeriod, today, attachEvents, function (data) {
      if (onComplete) onComplete(data);

      // Initialize WebSocket after loading initial data
      initializeWebSocket(symbol);
    });
  }

  var _requestChartForPeriod = function (symbol, startPeriod, endPeriod, attachEvents, onComplete) {
    fetchChartData(symbol, startPeriod, endPeriod, apiGranularity);
  }

  requestChartForTimeFrame(symbol, timeframe, granularity);



  if (loading) return <div className="p-4 text-gray-400">Loading chart...</div>;
  // if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full"
      />
    </div>
  );
};

export default CryptoChart;