import Chart from '@/components/Chart';
import { GraphData } from './api/energy/route';

async function getData(): Promise<GraphData> {
  // Could be environment driven in the future e.g. API_BASE_URL?
  const baseUrl =
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://example.com';

  // Consider using caching in production environments to reduce potentially
  // expensive server load, data is half hourly so 30 minutes used here, but
  // would potentially need to be lower for quicker updates
  const fetchOptions =
    process.env.NODE_ENV === 'production' ? { next: { revalidate: 30 * 60 } } : {};
  const res = await fetch(baseUrl + '/api/energy', fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch data'); // Report to logging
  }
  return await res.json();
}

export default async function Home() {
  const data = await getData();
  return (
    <main className="flex justify-center w-full min-h-screen p-24">
      <Chart data={data} />
    </main>
  );
}

/*
  Future improvements:
   - Real time updates (polling api endpoint?)
   - List anomalous results in separate component?
   - Make use of loading screen support in Next (or use React Suspense) for slower connections
   - Use error states/boundaries when the api is down/broken
   - Unit tests for api endpoint (maybe split up into individual functions?)
   - I don't know how testable highcharts is, but can use react testing library
     to test that it gets rendered with the correct options
*/
