'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Button } from '@/components/ui/button';

interface PaymentStatusProps {
  data?: Array<{ status: string, count: number, amount: number }>;
}

const COLORS: Record<string, string> = {
  'paid': '#10b981',      // Emerald
  'pending': '#f59e0b',   // Amber
  'partially_paid': '#3b82f6', // Blue
  'partial': '#3b82f6',
  'unpaid': '#ef4444'     // Rose
};

export default function PaymentStatusChart({ data = [] }: PaymentStatusProps) {
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');

  const getInsight = () => {
    if (!data.length) return null;
    const pending = data.find(d => d.status === 'pending' || d.status === 'partial');
    if (!pending) return "Payment Insight: All collections are currently up to date!";
    return `Payment Insight: ₹${pending.amount.toLocaleString()} is still pending collection.`;
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Payment Status</h3>
          <p className="text-xs text-muted-foreground mt-1">Collection overview by order status.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMetric('amount')}
            className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              metric === 'amount' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Amount
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMetric('count')}
            className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              metric === 'count' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Orders
          </Button>
        </div>
      </div>

      <div className="p-8">
        {!data.length ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No payment data available.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey={metric}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.status.toLowerCase()] || '#94a3b8'} 
                      className="outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                  formatter={(value: number) => [
                    metric === 'amount' ? `₹${value.toLocaleString()}` : value, 
                    metric === 'amount' ? 'Amount' : 'Orders'
                  ]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/5 border border-amber-100 dark:border-amber-900/20">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {getInsight()}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
