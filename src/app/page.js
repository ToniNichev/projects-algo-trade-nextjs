import OpenChart from '@/app/components/OpenChart/OpenChart';
// import { CoinbaseDataProvider, MockDataProvider } from './ChartDataProviders';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Crypto Chart Dashboard</h1>
      <div className="w-full max-w-6xl">
        <OpenChart 
          symbol="ETH-USD"
          width={750}
          height={350}
        />
      </div>
    </main>
  );
}