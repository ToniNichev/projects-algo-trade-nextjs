// ChartTooltip.js
import { useEffect, useRef } from "react";
import { useChartConfig } from "../ChartConfigContext";

const ChartTooltip = ({ drawingCanvas, chartData, offset, mouseX, mouseY }) => {
  const { config } = useChartConfig();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!drawingCanvas || !chartData.length) return;
    const ctx = drawingCanvas.getContext("2d");

    const contextWidth = drawingCanvas.width - 50;
    const contextHeight = drawingCanvas.height;
    const padding = config.contextPadding;

    ctx.clearRect(0, 0, contextWidth, contextHeight);

    const dataLength = chartData.length - (offset.start + offset.end);
    const stepX = contextWidth / dataLength;
    const dataIndex = offset.start + Math.floor(mouseX / stepX);
    const prevIndex = dataIndex > 0 ? dataIndex - 1 : dataIndex;

    if (!chartData[dataIndex]) return;

    const data = chartData[dataIndex];
    const prevData = chartData[prevIndex];
    const x = (dataIndex - offset.start) * stepX;
    const { min, max } = calculateMinMax(chartData, offset, dataLength);
    const scaleY = calculateYScale(min, max);
    const y = contextHeight - padding - (data.close - min) * scaleY;

    drawCrosshair(ctx, x, y, contextWidth, contextHeight);
    drawTooltipBox(ctx, x, y, data, prevData, contextWidth);
    drawDataPoint(ctx, x, y);
  }, [drawingCanvas, chartData, offset, mouseX, mouseY, config]);

  const calculateMinMax = (data, offset, length) => {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    for (let i = offset.start; i < offset.start + length; i++) {
      if (data[i]) {
        min = Math.min(min, parseFloat(data[i].low));
        max = Math.max(max, parseFloat(data[i].high));
      }
    }
    return { min, max };
  };

  const calculateYScale = (min, max) => {
    const height = drawingCanvas.height - config.contextPadding * 2;
    return height / (max - min);
  };

  const drawCrosshair = (ctx, x, y, width, height) => {
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.moveTo(x, config.contextPadding);
    ctx.lineTo(x, height - config.contextPadding);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawTooltipBox = (ctx, x, y, data, prevData, contextWidth) => {
    ctx.save();
    ctx.fillStyle = config.tooltip.background;
    
    const priceChange = data.close - prevData.close;
    const priceChangePercent = (priceChange / prevData.close) * 100;
    const changeColor = priceChange >= 0 ? "#4CAF50" : "#FF5252";

    const tooltipText = [
      formatDateTime(data.date),
      `O: $${data.open.toFixed(2)}`,
      `H: $${data.high.toFixed(2)}`,
      `L: $${data.low.toFixed(2)}`,
      `C: $${data.close.toFixed(2)}`,
      `Vol: ${formatVolume(data.volume)}`,
      `Change: ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)} (${priceChangePercent.toFixed(2)}%)`,
    ];

    ctx.font = config.tooltip.font;
    const textWidth = Math.max(...tooltipText.map((t) => ctx.measureText(t).width));
    const boxWidth = textWidth + config.tooltip.padding * 2;
    const boxHeight = tooltipText.length * 18 + config.tooltip.padding * 2;

    let tooltipX = x + 10;
    let tooltipY = y - boxHeight - 10;
    if (tooltipX + boxWidth > contextWidth) tooltipX = x - boxWidth - 10;
    if (tooltipY < 0) tooltipY = y - 50;

    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, boxWidth, boxHeight, config.tooltip.borderRadius);
    ctx.fill();

    tooltipText.forEach((text, i) => {
      ctx.fillStyle = i === tooltipText.length - 1 ? changeColor : config.tooltip.textColor;
      ctx.fillText(text, tooltipX + config.tooltip.padding, tooltipY + config.tooltip.padding + i * 18 + 12);
    });

    ctx.restore();
  };

  const drawDataPoint = (ctx, x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = config.lineColor;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) return (volume / 1e9).toFixed(1) + "B";
    if (volume >= 1e6) return (volume / 1e6).toFixed(1) + "M";
    if (volume >= 1e3) return (volume / 1e3).toFixed(1) + "K";
    return volume.toFixed(1);
  };

  return <canvas ref={canvasRef} width={drawingCanvas?.width} height={drawingCanvas?.height} />;
};

export default ChartTooltip;
