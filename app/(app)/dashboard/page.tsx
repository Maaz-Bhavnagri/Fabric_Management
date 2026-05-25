'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useDashboardData } from '@/hooks/useData';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import SalesChart from '@/components/dashboard/SalesChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import {
  StatsCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '@/components/ui/skeleton-loaders';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  Package,
  Users,
  Wallet,
  Scissors,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { metrics, loading: metricsLoading, error } = useDashboardData();
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
          subtitle="Lifetime Earnings"
          icon={<Wallet className="w-6 h-6" />}
          color="bg-primary/10 text-primary"
        />
        <StatsCard
          title={t('dashboard.totalOrders')}
          value={metrics.totalOrders}
          subtitle="Processed"
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatsCard
          title={t('dashboard.totalCustomers')}
          value={metrics.totalCustomers}
          subtitle="Registered"
          icon={<Users className="w-6 h-6" />}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatsCard
          title={t('dashboard.inventoryValue')}
          value={formatCurrency(metrics.inventoryValue)}
          subtitle="Asset Valuation"
          icon={<Package className="w-6 h-6" />}
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Revenue & Stitching Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Fabric Revenue (This Month)"
          value={`₹${((metrics.totalFabricRevenue ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Materials"
          icon={<Package className="w-6 h-6" />}
          color="bg-sky-500/10 text-sky-500"
          className="border-l-4 border-l-sky-500"
        />
        <StatsCard
          title="Stitching Revenue (This Month)"
          value={`₹${((metrics.totalStitchingRevenue ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Services"
          icon={<Scissors className="w-6 h-6" />}
          color="bg-indigo-500/10 text-indigo-500"
          className="border-l-4 border-l-indigo-500"
        />
        <StatsCard
          title="Tailor Expenses (This Month)"
          value={`₹${((metrics.totalTailorExpenses ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Contractor Cost"
          icon={<Users className="w-6 h-6" />}
          color="bg-red-500/10 text-red-500"
          className="border-l-4 border-l-red-500"
        />
        <StatsCard
          title="Stitching Profit (This Month)"
          value={`₹${((metrics.totalStitchProfit ?? 0)).toLocaleString('en-IN')}`}
          subtitle="Net Stitching Margin"
          icon={<Wallet className="w-6 h-6" />}
          color="bg-emerald-500/10 text-emerald-500"
          className="border-l-4 border-l-emerald-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={metrics.revenueVsProfit} />
        </div>
        <SalesChart data={metrics.categoryRevenue} />
      </div>

      {/* Recent Transactions Section */}
      <div>
        <RecentTransactions />
      </div>
    </div>
  );
}
