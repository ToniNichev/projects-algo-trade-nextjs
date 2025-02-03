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

  const draggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const [firstXpos, setFirstXpos] = useState(0.0);
  const [lastXpos, setLastXpos] = useState(0.0);


  const [offset, setOffset] = useState({
    start: 0,
    end: 0,
    fstart: 0,
    fend: 0
  });


  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const chartCanvasProps = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const contextPadding = config.context_padding || 50;
    const contextWidth = canvas.width - contextPadding;
    const contextHeight = canvas.height;
    return {
      canvas,
      ctx,
      contextPadding,
      contextWidth,
      contextHeight
    };
  }, [config.context_padding]);

  /**
   * Handle mouse events
   */
  const handleMouseDown = useCallback((event) => {
    draggingRef.current = true;
    lastMouseXRef.current = event.clientX;
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (draggingRef.current) {
      const dataLength = chartData.length;
      const { contextWidth } = chartCanvasProps();
      const diff = lastMouseXRef.current - event.clientX;
      const c = dataLength / contextWidth;
      const offsetX = Math.round(c * diff);

      setOffset({
        start: offsetX,
        end: offset.end,
        fstart: offset.fstart,
        fend: offset.fend,
      });
    }
  }, [chartData, offset, chartCanvasProps]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleMouseOut = useCallback(() => {
  }, []);

  /**
   * Draw chart
   */
  useEffect(() => {
    if (loading || !chartData.length || !canvasRef.current) return;
    const { canvas, ctx, contextPadding, contextWidth, contextHeight } = chartCanvasProps();

    // Clear and set background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataLength = chartData.length; // - (offset.start + offset.end);

    const minPrice = Math.min(...chartData.map(d => d.close));
    const maxPrice = Math.max(...chartData.map(d => d.close));
    const scaleY = (contextHeight - contextPadding * 2) / (maxPrice - minPrice);

    // Draw chart line
    ctx.beginPath();
    ctx.lineWidth = config.lineWidth;
    ctx.strokeStyle = config.lineColor;

    const stepX = contextWidth / dataLength; // Define step size


    for (let i = 0; i < dataLength; i++) {
      const dataIndex = i + offset.start;

      if (!chartData[dataIndex]) continue;

      const x = i * stepX;
      const y = contextHeight - contextPadding - (chartData[dataIndex].close - minPrice) * scaleY;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      if (i === 0) {
        setFirstXpos(x);
      }
      setLastXpos(x);
    }

    ctx.stroke();
    // Draw fill
    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint) {
      ctx.lineTo(contextWidth, contextHeight - contextPadding);
      ctx.lineTo(0, contextHeight - contextPadding);
      ctx.closePath();
      ctx.fillStyle = config.fillColor;
      ctx.fill();
    }
  }, [chartData, loading, config, offset, chartCanvasProps]);



  return (
    <>
    <div className="chartWrapper">
      <h1>{symbol}</h1>
      <div className="chartContainer">        
        {loading ? <p>Loading...</p> : null}
        <TimeframeSelector selectedTimeframe={timeFrame} onChange={setTimeFrame} />
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseOut}
        />
      </div>
    </div>

          {/* Styled JSX for component-scoped CSS */}
      <style jsx>{`
      .chartContainer canvas {
        border:1px solid red;
      }
      `}</style>
    </>
  );
};

export default OpenCharts;