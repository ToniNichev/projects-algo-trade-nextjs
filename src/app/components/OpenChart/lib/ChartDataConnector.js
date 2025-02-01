// useChartData.js
import { useState, useEffect } from "react";
import { useChartConfig } from "../ChartConfigContext";
import { useDateHelper } from "./useDateHelper"; // Assume DateHelper is a hook now

const CHART_FEED_URL = "https://ts-api.cnbc.com/harmony/app/bars/";

export const useChartData = (symbol, startPeriod, endPeriod, apiGranularity) => {
  const { config } = useChartConfig();
  const dateHelper = useDateHelper();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol || !startPeriod || !endPeriod) return;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        const startPeriodStr = dateHelper.dateToDateStr(startPeriod);
        const endPeriodStr = dateHelper.dateToDateStr(endPeriod);

        const url = `${CHART_FEED_URL}${symbol}/${apiGranularity}/${startPeriodStr}/${endPeriodStr}/adjusted/GMT.json`;
        console.log("Fetching URL:", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

        const data = await response.json();
        if (data?.barData?.priceBars) {
          setChartData(formatChartData(data.barData.priceBars));
        } else {
          console.error("Invalid response structure:", data);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, startPeriod, endPeriod, apiGranularity]);

  const formatChartData = (rawData) => {
    return rawData.map((item) => ({
      date: dateHelper.stringToDate(item.tradeTime),
      close: parseFloat(item.close),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseInt(item.volume, 10),
    }));
  };

  return { chartData, loading, error };
};
