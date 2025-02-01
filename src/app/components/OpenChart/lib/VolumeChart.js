import { useEffect, useRef } from "react";

const VolumeChart = ({ chartData, offset, config, priceChartHeight }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!chartData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const contextWidth = canvas.width - 50;
    const contextHeight = canvas.height;

    const volumeHeight = config.height;
    const startY = priceChartHeight + config.padding + 1;

    // Find max volume for scaling
    let maxVolume = Math.max(...chartData.map(d => d.volume));

    const contextPadding = config.context_padding || 0;
    const availableWidth = contextWidth - contextPadding * 2;
    const stepX = availableWidth / (chartData.length - offset.start - offset.end);
    const barWidth = Math.max(1, stepX - config.barSpacing);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    chartData.forEach((data, i) => {
      if (i < offset.start || i >= chartData.length - offset.end) return;

      const x = contextPadding + i * stepX;
      const barHeight = (data.volume / maxVolume) * volumeHeight;

      ctx.fillStyle = data.close >= (chartData[i - 1]?.close || data.close)
        ? config.barColor
        : config.barColorDown;

      ctx.fillRect(x, startY + volumeHeight - barHeight, barWidth, barHeight);
    });

    drawVolumeLabels(ctx, maxVolume, startY, config);
  }, [chartData, offset, config, priceChartHeight]);

  const drawVolumeLabels = (ctx, maxVolume, startY, config) => {
    const steps = 4;
    const stepValue = maxVolume / steps;

    ctx.font = "10px Arial";
    ctx.fillStyle = "#666666";

    for (let i = 0; i <= steps; i++) {
      const labelY = startY + config.height - (i / steps) * config.height;
      const volumeText = formatVolume(stepValue * i);
      ctx.fillText(volumeText, 10, labelY + 3);
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) return (volume / 1e9).toFixed(1) + "B";
    if (volume >= 1e6) return (volume / 1e6).toFixed(1) + "M";
    if (volume >= 1e3) return (volume / 1e3).toFixed(1) + "K";
    return volume.toString();
  };

  return <canvas ref={canvasRef} width={500} height={150} />;
};

export default VolumeChart;
