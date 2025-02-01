// PriceArrow.js
import { useEffect, useRef } from "react";
import { useChartConfig } from "../ChartConfigContext";

const PriceArrow = ({ drawingCanvas, chartData, offset, min, max, lastPrice }) => {
  const { config } = useChartConfig();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!drawingCanvas || !chartData.length) return;
    const ctx = drawingCanvas.getContext("2d");

    const contextWidth = drawingCanvas.width - 50;
    const contextHeight = drawingCanvas.height;
    const scaleY = (contextHeight - config.contextPadding * 2) / (max - min);
    const priceY = contextHeight - config.contextPadding - (lastPrice - min) * scaleY;
    const arrowX = contextWidth + 48;

    ctx.clearRect(0, 0, contextWidth, contextHeight);

    // Draw arrow
    ctx.fillStyle = config.priceArrow.fillColor;
    ctx.beginPath();
    ctx.moveTo(arrowX, priceY + 3);
    ctx.lineTo(arrowX - 45, priceY + 3);
    ctx.lineTo(arrowX - 50, priceY - 5);
    ctx.lineTo(arrowX - 45, priceY - 11);
    ctx.lineTo(arrowX, priceY - 11);
    ctx.closePath();
    ctx.fill();

    // Draw price text
    ctx.fillStyle = config.priceArrow.priceColor;
    ctx.font = "12px Arial";
    ctx.fillText(lastPrice.toFixed(2), arrowX - 44, priceY);

    // Draw last visible price point
    const lastVisibleIndex = chartData.length - 1 - offset.end;
    if (chartData[lastVisibleIndex]) {
      const x = (lastVisibleIndex - offset.start) * (contextWidth / (chartData.length - (offset.start + offset.end)));
      const y = contextHeight - config.contextPadding - (chartData[lastVisibleIndex].close - min) * scaleY;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = config.lineColor;
      ctx.fill();
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [drawingCanvas, chartData, offset, min, max, lastPrice, config]);

  return <canvas ref={canvasRef} width={drawingCanvas?.width} height={drawingCanvas?.height} />;
};

export default PriceArrow;
