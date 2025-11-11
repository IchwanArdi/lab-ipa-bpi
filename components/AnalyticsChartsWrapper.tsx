'use client';

import dynamic from 'next/dynamic';
import Card from './Card';

// Lazy load AnalyticsCharts (heavy component with recharts)
// This wrapper is needed because ssr: false can only be used in Client Components
const AnalyticsCharts = dynamic(() => import('@/components/AnalyticsCharts'), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="h-64 bg-gray-100 animate-pulse rounded" />
      </Card>
      <Card>
        <div className="h-64 bg-gray-100 animate-pulse rounded" />
      </Card>
    </div>
  ),
  ssr: false,
});

export default function AnalyticsChartsWrapper() {
  return <AnalyticsCharts />;
}
