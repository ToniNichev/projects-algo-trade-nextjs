import Chart from '@/app/components/OpenChart/Chart';

const Home = () => {
  const config = {
    lineWidth: 3,
    lineColor: '#3DA5ED',
    fillColor: '#EAF5FD',
    context_padding: 50,
    grid: {
      lineWidth: 0.2,
      lineColor: '#A9A9A9',
    },
    tooltip: {
      background: 'rgba(0,0,0,0.5)',
      textColor: '#FFFFFF',
      padding: 4,
      borderRadius: 4,
      font: '12px Arial',
    },
  };

  const chartDataConnector = {
  };

  return (
    <div>
      <h1>Next.js Chart</h1>
      <Chart
        canvasId="myChart"
        config={config}
        chartDataConnector={chartDataConnector}
        symbol="BTC-USD"
        timeFrame="1d"
        granularity="1h"
      />
    </div>
  );
};

export default Home;