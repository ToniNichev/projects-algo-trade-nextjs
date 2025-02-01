"use client";


import React, { useRef, useEffect, useState, useCallback } from "react";
import useChartData from "./lib/useChartData";
import { useChartConfig } from "./ChartConfigContext";
import TimeframeSelector from "./lib/TimeframeSelector";
import ChartGrid from "./lib/ChartGrid";
import ChartTooltip from "./lib/ChartTooltip";
import VolumeChart from "./lib/VolumeChart";
import PriceArrow from "./lib/PriceArrow";

const OpenCharts = ({ symbol, dataSource = "coinbase" }) => {
  const config = useChartConfig().config;
  const [timeFrame, setTimeFrame] = useState("1D");
  const { chartData, loading } = useChartData(symbol, timeFrame, dataSource);
  const canvasRef = useRef(null);
  
  // Dragging state
  const draggingRef = useRef(false);
  const kineticSpeedRef = useRef(0);
  const lastMouseXRef = useRef(0);
  const kineticTimerRef = useRef(null);
  const kineticCountRef = useRef(0);
  
  const [offset, setOffset] = useState({ 
    start: 0, 
    end: 0, 
    fstart: 0, 
    fend: 0 
  });
  
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lastPrice, setLastPrice] = useState(null);

  // Kinetic scrolling implementation
  const setKineticDragResidualSpeed = useCallback((speed, length) => {
    if (!canvasRef.current) return;
    
    const contextWidth = canvasRef.current.width - 50;
    const p = chartData.length - (offset.start + offset.end);
    const c = p / contextWidth;
    
    const d = Math.round(lastMouseXRef.current - (speed / 2));
    const drag = c * speed;
    
    setOffset(prev => ({
      ...prev,
      fstart: prev.fstart + drag,
      fend: prev.fend - drag,
      start: Math.round(prev.fstart),
      end: Math.round(prev.fend)
    }));

    // Continue kinetic movement with decay matching vanilla JS
    if (length > 0) {
      clearTimeout(kineticTimerRef.current);
      kineticTimerRef.current = setTimeout(() => {
        setKineticDragResidualSpeed(speed / 1.01, length - 0.06);
      }, 5);
    } else {
      kineticSpeedRef.current = 0;
    }
  }, [chartData.length, offset]);

  const handleMouseDown = useCallback((event) => {
    draggingRef.current = true;
    lastMouseXRef.current = event.clientX;
    kineticCountRef.current = 0;
    setTooltipVisible(false);
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (!draggingRef.current) {
      setMousePos({ x: event.clientX, y: event.clientY });
      setTooltipVisible(true);
      return;
    }

    const x = event.clientX;
    
    // Calculate kinetic speed
    kineticCountRef.current++;
    if (kineticCountRef.current > 1) {
      kineticSpeedRef.current = lastMouseXRef.current - x;
    }

    // Calculate drag amount (matching vanilla JS version)
    const contextWidth = canvasRef.current.width - 50;
    const p = chartData.length - (offset.start + offset.end);
    const c = p / contextWidth;
    const drag = c * (lastMouseXRef.current - x);

    // Update offset using the same approach as vanilla JS
    setOffset(prev => ({
      ...prev,
      fstart: prev.fstart + drag,
      fend: prev.fend - drag,
      start: Math.round(prev.fstart),
      end: Math.round(prev.fend)
    }));

    lastMouseXRef.current = x;
  }, [chartData.length, offset]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    if (kineticSpeedRef.current !== 0) {
      setKineticDragResidualSpeed(
        kineticSpeedRef.current,
        Math.abs(kineticSpeedRef.current)
      );
    }
  }, [setKineticDragResidualSpeed]);

  const handleMouseOut = useCallback(() => {
    draggingRef.current = false;
    setTooltipVisible(false);
    if (kineticSpeedRef.current !== 0) {
      setKineticDragResidualSpeed(
        kineticSpeedRef.current,
        Math.abs(kineticSpeedRef.current)
      );
    }
  }, [setKineticDragResidualSpeed]);

  // Drawing logic
  useEffect(() => {
    if (loading || !chartData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const contextWidth = canvas.width - 50;
    const contextHeight = canvas.height;
    const contextPadding = config.context_padding || 50;

    // Clear and set background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate price range
    const visibleData = chartData.slice(
      Math.max(0, offset.start),
      chartData.length - offset.end
    );
    
    const minPrice = Math.min(...visibleData.map(d => d.low));
    const maxPrice = Math.max(...visibleData.map(d => d.high));
    const scaleY = (contextHeight - contextPadding * 2) / (maxPrice - minPrice);

    // Draw chart line
    ctx.beginPath();
    ctx.strokeStyle = config.lineColor;
    ctx.lineWidth = config.lineWidth;

    visibleData.forEach((data, i) => {
      const x = (i / visibleData.length) * contextWidth;
      const y = contextHeight - contextPadding - (data.close - minPrice) * scaleY;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();

    // Draw fill
    const lastPoint = visibleData[visibleData.length - 1];
    if (lastPoint) {
      ctx.lineTo(contextWidth, contextHeight - contextPadding);
      ctx.lineTo(0, contextHeight - contextPadding);
      ctx.closePath();
      ctx.fillStyle = config.fillColor;
      ctx.fill();
    }
  }, [chartData, loading, config, offset]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (kineticTimerRef.current) {
        clearTimeout(kineticTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="chartWrapper">
      <h1>{symbol}</h1>
      <TimeframeSelector selectedTimeframe={timeFrame} onChange={setTimeFrame} />
      <div className="chartContainer">
        {loading ? <p>Loading...</p> : null}
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseOut}
        />
        <ChartGrid chartData={chartData} offset={offset} config={config} />
        <VolumeChart 
          chartData={chartData} 
          offset={offset} 
          config={config.volumeChart} 
          priceChartHeight={300} 
        />
        <PriceArrow 
          chartData={chartData} 
          offset={offset} 
          config={config} 
        />
        <ChartTooltip 
          chartData={chartData} 
          offset={offset} 
          config={config} 
          visible={tooltipVisible} 
          mousePos={mousePos} 
        />
      </div>
    </div>
  );
};

export default OpenCharts;