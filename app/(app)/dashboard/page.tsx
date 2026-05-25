'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useDashboardData } from '@/hooks/useData';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import SalesChart from '@/components/dashboard/SalesChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import TopTailorsCard from '@/components/dashboard/TopTailorsCard';
import MostProfitableStitchTypesCard from '@/components/dashboard/MostProfitableStitchTypesCard';
import {
  StatsCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '@/components/ui/skeleton-loaders';
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  Package,
  Users,
  Wallet,
  Scissors,
  Plus,
  AlertTriangle,
  Clock,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState('30d');
  const { metrics, loading: metricsLoading, error } = useDashboardData(range);
  const { user } = useAuth();

  const displayName = useMemo(() => {
    const fullName = (user?.user_metadata as Record<string, unknown> | undefined)?.fullName;
    return (typeof fullName === 'string' && fullName.trim()) || user?.email || 'Admin';
  }, [user]);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value.toLocaleString()}`;
  };

  const getRangeLabel = () => {
    switch (range) {
      case 'today': return 'Today';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '3m': return 'Last 3 Months';
      case '1y': return 'Last Year';
      default: return 'Selected Period';
    }
  };

  if (metricsLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50">
        <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4 border-red-200 text-red-600 hover:bg-red-100"
          onClick={() => window.location.reload()}
        >
          Try Refreshing
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {t('dashboard.welcome')}, <span className="text-primary">{displayName}</span> 👋
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="1y">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/orders">
            <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-bold">
              <Plus className="w-4 h-4" /> New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('dashboard.totalRevenue')}
          value={formatCurrency(metrics.totalRevenue)}
          subtitle={getRangeLabel()}
          icon={<Wallet className="w-6 h-6" />}
          color="bg-primary/10 text-primary"
        />
        <StatsCard
          title={t('dashboard.totalOrders')}
          value={metrics.totalOrders}
          subtitle={`Processed in ${getRangeLabel().toLowerCase()}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatsCard
          title={t('dashboard.totalCustomers')}
          value={metrics.totalCustomers}
          subtitle="Registered Lifetime"
          icon={<Users className="w-6 h-6" />}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatsCard
          title={t('dashboard.inventoryValue')}
          value={formatCurrency(metrics.inventoryValue)}
          subtitle="Live Asset Valuation"
          icon={<Package className="w-6 h-6" />}
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Overdue Orders"
          value={metrics.overdueOrders || 0}
          subtitle="Delivery date passed"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="bg-red-500/10 text-red-500"
          className="border-l-4 border-l-red-500"
        />
        <StatsCard
          title="Urgent Orders"
          value={metrics.urgentOrders || 0}
          subtitle="High priority pending"
          icon={<Clock className="w-6 h-6" />}
          color="bg-amber-500/10 text-amber-500"
          className="border-l-4 border-l-amber-500"
        />
        <StatsCard
          title="Average Order Value"
          value={formatCurrency(metrics.averageOrderValue || 0)}
          subtitle={`In ${getRangeLabel().toLowerCase()}`}
          icon={<IndianRupee className="w-6 h-6" />}
          color="bg-emerald-500/10 text-emerald-500"
          className="border-l-4 border-l-emerald-500"
        />
      </div>

      {/* Revenue & Stitching Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={`Fabric Revenue`}
          value={`₹${((metrics.totalFabricRevenue ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Materials"
          icon={<Package className="w-6 h-6" />}
          color="bg-sky-500/10 text-sky-500"
        />
        <StatsCard
          title={`Stitching Revenue`}
          value={`₹${((metrics.totalStitchingRevenue ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Services"
          icon={<Scissors className="w-6 h-6" />}
          color="bg-indigo-500/10 text-indigo-500"
        />
        <StatsCard
          title={`Tailor Expenses`}
          value={`₹${((metrics.totalTailorExpenses ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Contractor Cost"
          icon={<Users className="w-6 h-6" />}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatsCard
          title={`Stitching Profit`}
          value={`₹${((metrics.totalStitchProfit ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Net Stitching Margin"
          icon={<Wallet className="w-6 h-6" />}
          color="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={metrics.revenueVsProfit} />
        </div>
        <SalesChart data={metrics.categoryRevenue} />
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TopTailorsCard data={metrics.topTailors} />
        </div>
        <div className="lg:col-span-2">
          <MostProfitableStitchTypesCard data={metrics.mostProfitableStitchTypes} />
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div>
        <RecentTransactions />
      </div>
    </div>
  );
}
