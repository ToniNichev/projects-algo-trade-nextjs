import { useState } from "react";

const getGranularity = (timeframe) => {
  const granularityMap = {
    "1D": 86400,
    "5D": 86400 * 5,
    "1M": 86400 * 30,
    "3M": 86400 * 90,
    "6M": 86400 * 180,
    "YTD": 86400 * 365,
    "1Y": 86400 * 365,
    "5Y": 86400 * 365 * 5,
    "ALL": 86400 * 365 * 5,
  };
  return granularityMap[timeframe] || 86400;
};

const formatCoinbaseData = (rawData) => {
  rawData.sort((a, b) => a[0] - b[0]);

  return rawData.map((candle) => ({
    date: new Date(candle[0] * 1000),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
};

const CoinbaseDataConnector = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChartData = async (symbol, startPeriod, endPeriod, timeframe) => {
    setLoading(true);
    setError(null);

    try {
      const granularity = getGranularity(timeframe);
      const timeRange = endPeriod.getTime() - startPeriod.getTime();
      const maxDataPoints = 300;
      const interval = granularity * 1000;
      const numChunks = Math.ceil(timeRange / interval / maxDataPoints);
      const chunkSize = timeRange / numChunks;

      const fetchPromises = Array.from({ length: numChunks }).map((_, i) => {
        const chunkStart = new Date(startPeriod.getTime() + i * chunkSize);
        const chunkEnd = new Date(
          Math.min(chunkStart.getTime() + chunkSize, endPeriod.getTime())
        );

        const url = `https://api.exchange.coinbase.com/products/${symbol}/candles?` +
          `start=${chunkStart.toISOString()}&` +
          `end=${chunkEnd.toISOString()}&` +
          `granularity=${granularity}`;

        console.log("Fetching:", url);

        return fetch(url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Network error: ${response.statusText}`);
            }
            return response.json();
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
            return [];
          });
      });

      const allChunks = await Promise.all(fetchPromises);
      const allData = allChunks.flat();
      const formattedData = formatCoinbaseData(allData);

      setChartData(formattedData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { chartData, loading, error, fetchChartData };
};

export default CoinbaseDataConnector;
