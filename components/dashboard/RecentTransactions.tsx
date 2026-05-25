'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useSalesData } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowUpRight, ShoppingCart as ShoppingCartIcon } from 'lucide-react';

export default function RecentTransactions() {
  const { t } = useLanguage();
  const { orders, loading } = useSalesData();

  const recentOrders = orders.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50';
      case 'pending':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/50';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-100 dark:border-slate-800';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-none shadow-md shadow-black/5 p-6 flex flex-col items-center justify-center h-64">
        <Spinner className="w-10 h-10 text-primary" />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading transactions...</p>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-none shadow-md shadow-black/5 p-0 overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {t('dashboard.recentTransactions')}
          </h3>
          <p className="text-xs text-muted-foreground">Monitor latest store activity</p>
        </div>
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 rounded-xl">
            {t('dashboard.viewAll')} <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCartIcon className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">{t('sales.noOrders')}</h4>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Start recording sales to see them here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  {t('sales.orderId')}
                </th>
                <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  {t('sales.customer')}
                </th>
                <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider text-right">
                  {t('sales.total')}
                </th>
                <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider text-center">
                  {t('sales.status')}
                </th>
                <th className="py-4 px-6 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <span className="text-sm font-bold text-foreground">#{order.invoiceNumber}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium">{order.customer?.fullName || 'Walk-in'}</span>
                      <span className="text-[11px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-sm font-extrabold text-foreground">
                      ₹{order.grandTotal?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getStatusColor(
                        order.paymentStatus || 'pending'
                      )}`}
                    >
                      {t(`sales.${order.paymentStatus || 'pending'}`)}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
