"use client";

// Helper function to format candle data
const formatCandleData = (rawData) => {
  // Sort data by timestamp first
  rawData.sort((a, b) => a[0] - b[0]);
  
  // Format the data
  return rawData.map(candle => ({
    date: new Date(candle[0] * 1000),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5])
  }));
};

// Coinbase data provider
export const createCoinbaseProvider = () => {
  let ws = null;
  let subscribers = new Set();

  const fetchCandles = async (symbol, startTime, endTime, granularity) => {
    try {
      const maxDataPoints = 300;
      const timeRange = endTime.getTime() - startTime.getTime();
      const interval = granularity * 1000; // Convert to milliseconds
      const numChunks = Math.ceil((timeRange / interval) / maxDataPoints);
      const chunkSize = timeRange / numChunks;

      // Create array of promises for each chunk
      const fetchPromises = Array.from({ length: numChunks }).map((_, i) => {
        const chunkStart = new Date(startTime.getTime() + (i * chunkSize));
        const chunkEnd = new Date(Math.min(
          chunkStart.getTime() + chunkSize,
          endTime.getTime()
        ));

        const url = `https://api.exchange.coinbase.com/products/${symbol}/candles?` +
          `start=${chunkStart.toISOString()}&` +
          `end=${chunkEnd.toISOString()}&` +
          `granularity=${granularity}`;

        return fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
          })
          .catch(error => {
            console.error("Error fetching chunk:", error);
            return [];
          });
      });

      const allChunks = await Promise.all(fetchPromises);
      const allData = allChunks.flat();
      
      return formatCandleData(allData);

    } catch (error) {
      console.error("Error in loadChartData:", error);
      throw error;
    }
  };

  const subscribeToRealTime = (symbol, onUpdate) => {
    if (!ws) {
      ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      ws.onopen = () => {
        console.log('WebSocket Connected');
        const subscribeMessage = {
          type: "subscribe",
          product_ids: [symbol],
          channels: ["ticker"]
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker') {
          const tickerData = {
            price: parseFloat(data.price),
            time: new Date(data.time),
            volume_24h: parseFloat(data.volume_24h),
            high_24h: parseFloat(data.high_24h),
            low_24h: parseFloat(data.low_24h),
            open_24h: parseFloat(data.open_24h)
          };
          
          subscribers.forEach(callback => callback(tickerData));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        ws = null;
      };
    }

    subscribers.add(onUpdate);
    return () => subscribers.delete(onUpdate);
  };

  const unsubscribe = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    subscribers.clear();
  };

  return {
    fetchCandles,
    subscribeToRealTime,
    unsubscribe
  };
};

// Mock data provider for testing
export const createMockProvider = () => {
  let intervalId = null;

  const fetchCandles = async (symbol, startTime, endTime, granularity) => {
    const data = [];
    let currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      const basePrice = 1800 + Math.random() * 200;
      data.push({
        date: new Date(currentTime),
        open: basePrice,
        high: basePrice + Math.random() * 10,
        low: basePrice - Math.random() * 10,
        close: basePrice + (Math.random() - 0.5) * 20,
        volume: Math.random() * 1000
      });
      
      currentTime = new Date(currentTime.getTime() + granularity * 1000);
    }
    
    return data;
  };

  const subscribeToRealTime = (symbol, onUpdate) => {
    intervalId = setInterval(() => {
      const mockUpdate = {
        price: 1800 + Math.random() * 200,
        time: new Date(),
        volume_24h: Math.random() * 10000,
        high_24h: 2000,
        low_24h: 1600,
        open_24h: 1800
      };
      onUpdate(mockUpdate);
    }, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  };

  const unsubscribe = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return {
    fetchCandles,
    subscribeToRealTime,
    unsubscribe
  };
};

// Helper function to determine appropriate granularity based on timeframe
export const getGranularity = (timeframe) => {
  const granularityMap = {
    '1H': 60,      // 1 minute intervals
    '1D': 300,     // 5 minute intervals
    '5D': 900,     // 15 minute intervals
    '1M': 3600,    // 1 hour intervals
    '3M': 21600,   // 6 hour intervals
    '6M': 86400,   // 1 day intervals
    'YTD': 86400,  // 1 day intervals
    '1Y': 86400,   // 1 day intervals
    'ALL': 86400   // 1 day intervals
  };
  return granularityMap[timeframe] || 86400; // Default to 1 day
};