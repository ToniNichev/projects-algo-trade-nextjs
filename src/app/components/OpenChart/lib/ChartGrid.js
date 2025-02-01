// ChartGrid.js
import { useEffect, useRef } from "react";
import { useChartConfig } from "../ChartConfigContext";
import { useDateHelper } from "./useDateHelper";

const ChartGrid = ({ drawingCanvas, chartData, offset, min, max, apiGranularity }) => {
  const { config } = useChartConfig();
  const { getMonthName } = useDateHelper();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!drawingCanvas || !chartData.length) return;
    const ctx = drawingCanvas.getContext("2d");

    const contextWidth = drawingCanvas.width - 50;
    const contextHeight = drawingCanvas.height;
    const verticalPadding = 10;
    const padding = config.contextPadding;

    ctx.clearRect(0, 0, contextWidth, contextHeight);
    ctx.beginPath();
    ctx.strokeStyle = config.grid.lineColor;
    ctx.lineWidth = config.grid.lineWidth;
    ctx.font = config.grid.font;
    ctx.fillStyle = config.grid.lineColor;

    const dataLength = chartData.length - (offset.start + offset.end);
    const stepX = contextWidth / dataLength;

    let oldYear = -1,
      oldMonth = -1,
      oldDay = -1,
      oldHour = -1,
      lastMonthChangeX = -1;

    const validStartIndex = Math.max(0, offset.start);
    const validEndIndex = Math.min(chartData.length - 1, offset.start + dataLength - 1);

    const startDate = chartData[validStartIndex]?.date;
    const endDate = chartData[validEndIndex]?.date;

    let totalDays = 0;
    if (startDate && endDate) {
      totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    const showDays = totalDays > 0 && totalDays <= 30;
    const showHours = totalDays <= 2;

    for (let i = 0; i < contextWidth; i++) {
      const dataIndex = Math.round(i / stepX) + offset.start;

      if (chartData[dataIndex]) {
        const date = chartData[dataIndex].date;
        const month = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        const hour = date.getHours();

        if (month !== oldMonth) {
          oldMonth = month;
          lastMonthChangeX = i;

          if (year !== oldYear) {
            ctx.font = `bold ${config.grid.font}`;
            ctx.strokeStyle = config.grid.yearColor;
            ctx.fillStyle = config.grid.yearColor;
            ctx.moveTo(i, 0);
            ctx.lineTo(i, contextHeight - padding);
            ctx.fillText(year, i - 10, contextHeight - verticalPadding);
            oldYear = year;
          } else {
            ctx.strokeStyle = config.grid.monthColor;
            ctx.fillStyle = config.grid.monthColor;
            ctx.moveTo(i, 0);
            ctx.lineTo(i, contextHeight - padding);
            ctx.fillText(getMonthName(month), i - 10, contextHeight - verticalPadding);
          }
        } else if (showDays && day !== oldDay) {
          ctx.strokeStyle = config.grid.dayColor;
          ctx.fillStyle = config.grid.dayColor;
          ctx.moveTo(i, 0);
          ctx.lineTo(i, contextHeight - padding);
          ctx.fillText(day, i - 2, contextHeight - verticalPadding);
          oldDay = day;
        } else if (hour !== 0 && showHours && hour !== oldHour && apiGranularity < 900) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, contextHeight - padding);
          ctx.fillText(`${hour.toString().padStart(2, "0")}:00`, i + 2, contextHeight - verticalPadding);
          oldHour = hour;
        }
      }
    }

    const stepY = 30;
    const priceRange = max - min;
    const stepPrice = priceRange / (contextHeight / stepY);

    for (let y = 0; y < contextHeight - padding; y += stepY) {
      const price = max - (y / (contextHeight - padding)) * priceRange;
      ctx.moveTo(0, y);
      ctx.lineTo(contextWidth, y);
      ctx.fillText(price.toFixed(2), contextWidth + 1, y);
    }

    ctx.stroke();
  }, [drawingCanvas, chartData, offset, min, max, apiGranularity, config]);

  return <canvas ref={canvasRef} width={drawingCanvas?.width} height={drawingCanvas?.height} />;
};

export default ChartGrid;
