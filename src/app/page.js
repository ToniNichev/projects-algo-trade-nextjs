import OpenCharts from '@/app/components/OpenChart/OpenChart';
// import { CoinbaseDataProvider, MockDataProvider } from './ChartDataProviders';

import React from "react";
import { ChartConfigProvider } from "./components/OpenChart/ChartConfigContext";
// import OpenCharts from "./OpenCharts";

const App = () => {
  return (
    <ChartConfigProvider>
      <div>
        <h1>Stock Chart</h1>
        <OpenCharts symbol="ETH-USD" />
      </div>
    </ChartConfigProvider>
  );
};

export default App;