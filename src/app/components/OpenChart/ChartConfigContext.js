"use client";

// ChartConfigContext.js
import React, { createContext, useContext, useState } from "react";

const defaultConfig = {
  lineWidth: 3,
  lineColor: "#3DA5ED",
  fillColor: "#EAF5FD",
  backgroundColor: "#FFFFFF",
  contextPadding: 50,
  grid: {
    font: "12px Arial",
    lineWidth: 0.3,
    lineColor: "#A9A9A9",
    yearColor: "red",
    monthColor: "green",
    dayColor: "blue",
  },
  priceArrow: {
    fillColor: "#3DA5ED",
    priceColor: "#FFFFFF",
  },
  interaction: {
    scrollingSpeed: 42,
  },
  tooltip: {
    background: "rgba(0,0,0,0.5)",
    textColor: "#FFFFFF",
    padding: 4,
    borderRadius: 4,
    font: "12px Arial",
  },
  volumeChart: {
    width: 800,
    barColor: "rgba(165, 214, 255, 0.8)",
    barColorDown: "rgba(255, 158, 158, 0.8)",
    barSpacing: 1,
    height: 100,
    padding: 5,
  },
};

const ChartConfigContext = createContext();

export const ChartConfigProvider = ({ children, customConfig = {} }) => {
  const [config, setConfig] = useState({ ...defaultConfig, ...customConfig });

  const updateConfig = (newConfig) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...newConfig }));
  };

  return (
    <ChartConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ChartConfigContext.Provider>
  );
};

export const useChartConfig = () => {
  return useContext(ChartConfigContext);
};
