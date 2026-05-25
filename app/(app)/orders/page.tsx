'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useSalesData } from '@/hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import dynamic from 'next/dynamic';
const SalesTable = dynamic(() => import('@/components/sales/SalesTable'), { ssr: false });
import CounterOrderForm from '@/components/sales/CounterOrderForm';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertCircle,
  ArrowUpDown,
  Hash,
  X,
  ShoppingCart
} from 'lucide-react';
import { filterRank } from '@/lib/fuzzy-search';
import { sortByKey, type SortDir } from '@/lib/sort-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Prefetch heavy dependencies for the add/edit order modal
  const handlePrefetch = () => {
    queryClient.prefetchQuery({ queryKey: ['customers'], queryFn: () => api.customersApi.getCustomers() });
    queryClient.prefetchQuery({ queryKey: ['inventory'], queryFn: () => api.inventoryApi.getFabrics() });
  };

  const {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    getCustomerByPhone,
    getOrderById,
    updateOrderStatus,
    deleteOrder
  } = useSalesData(filterStatus || undefined);

  const sortKeys = ['createdAt', 'grandTotal', 'paymentStatus'] as const;
  type SortKey = (typeof sortKeys)[number];
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const searchableOrders = useMemo(() => {
    return orders.map(order => ({
      ...order,
      _searchDate: new Date(order.createdAt).toLocaleDateString(),
      _searchDate2: new Date(order.createdAt).toDateString(),
    }));
  }, [orders]);

  const visibleOrders = useMemo(
    () => sortByKey(filterRank(searchableOrders, searchTerm), sortKey, sortDir),
    [searchableOrders, searchTerm, sortKey, sortDir]
  );

  const statuses = ['paid', 'pending'];

  // Quick stats summary
  const stats = useMemo(() => {
    const total = orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
    const pending = orders.filter(o => o.paymentStatus === 'pending').length;
    const paid = orders.filter(o => o.paymentStatus === 'paid').length;
    return { total, pending, paid };
  }, [orders]);

  const handleEditOrder = async (orderId: string) => {
    try {
      setEditingOrderId(orderId);
      setShowCreateModal(true);
    } catch (error) {
      console.error('Failed to load order for editing:', error);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingOrderId(null);
  };

  if (loading && !orders.length) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 border-none shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-2xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {t('sales.title', 'Orders')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Track and manage your store sales and order status
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={handlePrefetch}
          onFocus={handlePrefetch}
          className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-bold"
        >
          <Plus className="w-4 h-4" />
          {t('sales.createOrder', 'New Order')}
        </Button>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-md shadow-black/5 bg-card group hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sales (Filtered)</p>
              <h3 className="text-2xl font-black text-foreground">₹{stats.total.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-md shadow-black/5 bg-card group hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed Orders</p>
              <h3 className="text-2xl font-black text-foreground">{stats.paid}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-md shadow-black/5 bg-card group hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Payments</p>
              <h3 className="text-2xl font-black text-foreground">{stats.pending}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-none shadow-md shadow-black/5 p-4 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-muted/50 p-1 rounded-xl gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-lg h-9 px-4 text-xs font-bold transition-all", filterStatus === '' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-white/50")}
                onClick={() => setFilterStatus('')}
              >
                All Orders
              </Button>
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-lg h-9 px-4 text-xs font-bold capitalize transition-all", filterStatus === status ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-white/50")}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-slate-50/50">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 w-[120px] h-full shadow-none p-0 text-xs font-bold uppercase tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="createdAt">{t('common.date')}</SelectItem>
                  <SelectItem value="grandTotal">{t('sales.total')}</SelectItem>
                  <SelectItem value="paymentStatus">{t('sales.status')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-border mx-1" />
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 w-[60px] h-full shadow-none p-0 text-xs font-bold uppercase tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Main Table */}
      <SalesTable
        orders={visibleOrders}
        onUpdateStatus={updateOrderStatus}
        onDeleteOrder={deleteOrder}
        onGetOrderDetails={getOrderById}
        onEditOrder={handleEditOrder}
      />

      {/* ══ ADD ORDER WORKSPACE MODAL ══════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal panel */}
          <div className="relative h-full w-full sm:h-[95vh] sm:max-w-6xl bg-white dark:bg-slate-950 sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">

            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-border bg-white dark:bg-slate-900">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
                <ShoppingCart className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {editingOrderId ? t('sales.editOrder', 'Edit Order') : t('sales.createOrder', 'Add Order')}
                </h2>
                <p className="text-xs text-muted-foreground leading-tight">
                  Create customer purchase transaction
                </p>
              </div>

              {/* Invoice # display */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <Hash className="w-3 h-3" />
                <span className="text-foreground">New Order</span>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CounterOrderForm
                createOrder={createOrder}
                updateOrder={updateOrder}
                lookupCustomerByPhone={getCustomerByPhone}
                fetchOrderById={getOrderById}
                editingOrderId={editingOrderId}
                drafts={orders.filter((o) => o.isDraft)}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
