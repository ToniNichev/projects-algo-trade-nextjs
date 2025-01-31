"use client"; // Mark this component as a Client Component

import { useEffect, useRef, useState } from 'react';
// import ChatDataConnector from '../lib/ChatDataConnector';
// import DateHelper from '../lib/DateHelper';

const Chart = ({ canvasId, config, symbol, timeFrame, granularity }) => {
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [offset, setOffset] = useState({ start: 0, end: 0, fstart: 0.0, fend: 0.0 });
  const [lstPrice, setLstPrice] = useState(0.0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  //const chartDataConnector = new ChatDataConnector();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Initialize chart
    const initializeChart = async () => {
      const today = new Date();
      const startPeriod = dateHelper.getPastDateFromDate(today, timeFrame);
      const data = await chartDataConnector.loadChartData(symbol, startPeriod, today, granularity);
      setChartData(data);
      setLstPrice(data[data.length - 1].close);
      drawChart(ctx, data);
    };

    initializeChart();

    // Attach event listeners
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      setMouseX(event.clientX - rect.left);
      setMouseY(event.clientY - rect.top);
      setTooltipVisible(true);
    };

    const handleMouseOut = () => {
      setTooltipVisible(false);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseout', handleMouseOut);
    };
  }, [symbol, timeFrame, granularity]);

  const drawChart = (ctx, data) => {
    const { width, height } = ctx.canvas;
    const padding = config.context_padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate min and max values
    const { min, max } = calculateMinMax(data);
    const scaleY = calculateYScale(min, max, height, padding);

    // Draw chart line
    drawChartLine(ctx, data, scaleY, min, padding);

    // Draw fill area
    drawFillArea(ctx, data, scaleY, min, padding);

    // Draw grid
    drawGrid(ctx, data, min, max, padding);

    // Draw tooltip
    if (tooltipVisible) {
      drawTooltip(ctx, data, mouseX, mouseY);
    }
  };

  const calculateMinMax = (data) => {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    data.forEach((item) => {
      min = Math.min(min, item.close);
      max = Math.max(max, item.close);
    });

    return { min, max };
  };

  const calculateYScale = (min, max, height, padding) => {
    return (height - padding * 2) / (max - min);
  };

  const drawChartLine = (ctx, data, scaleY, min, padding) => {
    const { width, height } = ctx.canvas;
    const stepX = width / data.length;

    ctx.beginPath();
    ctx.lineWidth = config.lineWidth;
    ctx.strokeStyle = config.lineColor;

    data.forEach((item, index) => {
      const x = index * stepX;
      const y = height - padding - (item.close - min) * scaleY;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const drawFillArea = (ctx, data, scaleY, min, padding) => {
    const { width, height } = ctx.canvas;
    const stepX = width / data.length;

    ctx.beginPath();
    ctx.moveTo(0, height - padding);
    data.forEach((item, index) => {
      const x = index * stepX;
      const y = height - padding - (item.close - min) * scaleY;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height - padding);
    ctx.closePath();

    ctx.fillStyle = config.fillColor;
    ctx.fill();
  };

  const drawGrid = (ctx, data, min, max, padding) => {
    const { width, height } = ctx.canvas;

    // Draw horizontal grid lines
    ctx.strokeStyle = config.grid.lineColor;
    ctx.lineWidth = config.grid.lineWidth;

    const yStep = (max - min) / 5;
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - i * yStep * ((height - padding * 2) / (max - min));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawTooltip = (ctx, data, mouseX, mouseY) => {
    const { width, height } = ctx.canvas;
    const padding = config.context_padding;

    // Find the closest data point
    const stepX = width / data.length;
    const index = Math.floor(mouseX / stepX);
    const point = data[index];

    if (point) {
      const tooltipX = mouseX + 10;
      const tooltipY = mouseY + 10;

      // Draw tooltip background
      ctx.fillStyle = config.tooltip.background;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, 100, 40, config.tooltip.borderRadius);
      ctx.fill();

      // Draw tooltip text
      ctx.fillStyle = config.tooltip.textColor;
      ctx.font = config.tooltip.font;
      ctx.fillText(`Price: ${point.close}`, tooltipX + 5, tooltipY + 20);
    }
  };
  

  return (
    <canvas
      ref={canvasRef}
      id={canvasId}
      width={800}
      height={400}
      style={{ border: '1px solid #000' }}
    />
  );
};

export default Chart;