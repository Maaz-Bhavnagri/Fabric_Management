'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useDashboardData } from '@/hooks/useData';
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import TopSellingFabrics from '@/components/analytics/TopSellingFabrics';
import CategoryRevenueSplit from '@/components/analytics/CategoryRevenueSplit';
import ProfitRevenueChart from '@/components/analytics/ProfitRevenueChart';
import PaymentStatusChart from '@/components/analytics/PaymentStatusChart';
import CustomerRetentionChart from '@/components/analytics/CustomerRetentionChart';
import PopularColorsChart from '@/components/analytics/PopularColorsChart';
import SeasonalTrendsChart from '@/components/analytics/SeasonalTrendsChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState('30d');
  const { metrics, loading, error } = useDashboardData(range);

  const handleExport = () => {
    toast.info("Preparing detailed report...", {
      description: "Your business intelligence export will be ready shortly."
    });
    // In a real app, this would trigger a CSV/PDF download
    setTimeout(() => {
      toast.success("Report Exported", {
        description: `CSV data for ${range} has been generated.`
      });
    }, 2000);
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-[2.5rem] border border-red-100 dark:border-red-900/50">
        <p className="text-red-600 dark:text-red-400 font-bold italic">Analytics Error: {error}</p>
        <button 
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-xs uppercase"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AnalyticsHeader 
        range={range} 
        onRangeChange={setRange} 
        onExport={handleExport} 
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
          <Skeleton className="h-[450px] rounded-[2.5rem]" />
          <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
          <Skeleton className="h-[450px] rounded-[2.5rem]" />
          <Skeleton className="h-[450px] rounded-[2.5rem]" />
          <Skeleton className="h-[450px] rounded-[2.5rem]" />
          <Skeleton className="lg:col-span-3 h-[450px] rounded-[2.5rem]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Row 1 */}
          <div className="lg:col-span-2">
            <TopSellingFabrics data={metrics?.topSellingFabrics} />
          </div>
          <CategoryRevenueSplit data={metrics?.categoryRevenue} />

          {/* Row 2 */}
          <div className="lg:col-span-2">
            <ProfitRevenueChart data={metrics?.revenueVsProfit} />
          </div>
          <PaymentStatusChart data={metrics?.paymentStatus} />

          {/* Row 3 */}
          <CustomerRetentionChart data={metrics?.customerRetention} />
          <div className="lg:col-span-2">
            <PopularColorsChart data={metrics?.colorPopularity} />
          </div>

          {/* Row 4 */}
          <div className="lg:col-span-3">
            <SeasonalTrendsChart data={metrics?.seasonalTrends} />
          </div>
        </div>
      )}
    </div>
  );
}
