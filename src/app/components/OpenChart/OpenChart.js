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

  const firstXposRef = useRef(0);
  // kinectic scrolling parameters
  const lastTimeRef = useRef(0); // Tracks time for velocity calculation
  const velocityRef = useRef(0); // Stores last known velocity
  const isAnimatingRef = useRef(false); // Prevents multiple animation loops  


  const [offset, setOffset] = useState({
    start: 0,
    end: 0,
    fstart: 0,
    fend: 0
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Store canvas properties once
  const canvasPropsRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvasPropsRef.current = {
      canvas,
      ctx: canvas.getContext("2d"),
      contextPadding: config.context_padding || 50,
      contextWidth: canvas.width - (config.context_padding || 50),
      contextHeight: canvas.height,
    };
  }, [config.context_padding]);


  /**
   * Handle mouse events
   */

  const handleMouseDown = useCallback((event) => {
    draggingRef.current = true;
    velocityRef.current = 0; // Reset velocity when user starts dragging
    lastMouseXRef.current = event.clientX + firstXposRef.current;
    lastTimeRef.current = performance.now();
    isAnimatingRef.current = false; // Stop any ongoing kinetic animation
  }, []);


  const handleMouseMove = useCallback((event) => {
    if (!draggingRef.current || !canvasPropsRef.current) return;

    const dataLength = chartData.length;
    const { contextWidth } = canvasPropsRef.current;
    const diff = lastMouseXRef.current - event.clientX;

    // Calculate velocity (px per frame)
    velocityRef.current = diff;

    const c = dataLength / contextWidth;
    const offsetX = Math.round(c * diff);

    setOffset((prevOffset) => ({
      ...prevOffset,
      start: offsetX
    }));

    const currentX = event.clientX;
    const currentTime = performance.now();
    
    // Time difference in milliseconds
    const timeDiff = currentTime - lastTimeRef.current;

    if (timeDiff > 0.5) {
      // Calculate velocity (px per millisecond)
      velocityRef.current = (currentX - lastMouseXRef.current) / timeDiff;
    }    
    lastTimeRef.current = currentTime;
  }, [chartData.length]);


  const handleMouseUp = useCallback((event) => {
    draggingRef.current = false;
    firstXposRef.current = lastMouseXRef.current - event.clientX;
  }, []);


  const handleMouseOut = useCallback((event) => {
    draggingRef.current = false;
    firstXposRef.current = lastMouseXRef.current - event.clientX;
  }, []);


  /**
   * Kinetic scrolling
   */
  const kineticScroll = () => {
    if (!isAnimatingRef.current) return;

    let velocity = velocityRef.current;
    const friction = 0.95; // Controlls deceleration speed

    const animate = () => {
      if (Math.abs(velocity) < 0.5) {
        isAnimatingRef.current = false;
        return;
      }

      setOffset((prevOffset) => ({
        ...prevOffset,
        start: prevOffset.start + velocity,
      }));

      velocity *= friction;

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /**
   * Draw chart
   */
  useEffect(() => {
    if (loading || !chartData.length || !canvasRef.current) return;
    const { canvas, ctx, contextPadding, contextWidth, contextHeight } = canvasPropsRef.current;

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


      ctx.lineTo(x, y);


      //setFirstXpos(lastMouseXRef.current - x);
      //setLastXpos(x);
    }

    ctx.stroke();
    // Draw fill
    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint) {
      ctx.lineTo(contextWidth, contextHeight - contextPadding);
      ctx.lineTo(0, contextHeight - contextPadding);
      ctx.closePath();
      ctx.fillStyle = config.fillColor;
      //ctx.fill();
    }
  }, [chartData, loading, config, offset]);



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