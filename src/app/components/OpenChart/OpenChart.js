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


  const handleMouseDown = useCallback((event) => {
    draggingRef.current = true;
    lastMouseXRef.current = event.clientX;
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (draggingRef.current) {
      const diff = event.clientX - lastMouseXRef.current;;
      setOffset({
        start: offset.start - diff,
        end: offset.end + diff,
        fstart: offset.fstart,
        fend: offset.fend,
      });      
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleMouseOut = useCallback(() => {
  }, []);


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
    ctx.lineWidth = config.lineWidth;
    ctx.strokeStyle = config.lineColor;

    let prevX = 0, prevY = 0;

    const stepX = contextWidth / visibleData.length; // Define step size

    visibleData.forEach((data, i) => {
      const x = i * stepX;
      const y = contextHeight - contextPadding - (data.close - minPrice) * scaleY;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      prevX = x;
      prevY = y;

      if (i === 0) {
        setFirstXpos(x);
      }
      setLastXpos(x);
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
      </div>
    </div>
  );
};

export default OpenCharts;