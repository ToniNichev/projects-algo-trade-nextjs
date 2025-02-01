import { useState, useEffect } from "react";

const CHART_FEED_URL = "https://ts-api.cnbc.com/harmony/app/bars/";
const COINBASE_API_URL = "https://api.exchange.coinbase.com/products";

const useChartData = (symbol, timeFrame, dataSource = "cnbc") => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let data;
        if (dataSource === "cnbc") {
          data = await fetchCNBCData(symbol, timeFrame);
        } else {
          data = await fetchCoinbaseData(symbol, timeFrame);
        }
        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeFrame, dataSource]);

  return { chartData, loading };
};

const fetchCNBCData = async (symbol, timeFrame) => {
  const url = `${CHART_FEED_URL}${symbol}/${timeFrame}/adjusted/GMT.json`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data || !data.barData || !data.barData.priceBars) {
    throw new Error("Invalid CNBC data response");
  }

  return formatChartData(data.barData.priceBars);
};

const fetchCoinbaseData = async (symbol, timeFrame) => {
  const granularity = getCoinbaseGranularity(timeFrame);
  const url = `${COINBASE_API_URL}/${symbol}/candles?granularity=${granularity}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid Coinbase data response");
  }

  return formatCoinbaseData(data);
};

const formatChartData = (rawData) => {
  return rawData.map((item) => ({
    date: new Date(item.tradeTime),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    volume: parseInt(item.volume, 10),
  }));
};

const formatCoinbaseData = (rawData) => {
  return rawData
    .sort((a, b) => a[0] - b[0]) // Sort by timestamp
    .map((candle) => ({
      date: new Date(candle[0] * 1000),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
};

const getCoinbaseGranularity = (timeFrame) => {
  const granularityMap = {
    "1D": 86400,
    "5D": 86400 * 5,
    "1M": 86400 * 30,
    "3M": 86400 * 90,
    "6M": 86400 * 180,
    "YTD": 86400 * 365,
    "1Y": 86400 * 365,
    "5Y": 86400 * 5 * 365,
    "ALL": 86400 * 5 * 365,
  };
  return granularityMap[timeFrame] || 86400; // Default 1 day
};

export default useChartData;
