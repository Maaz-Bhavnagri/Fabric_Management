'use client';

import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ProfitRevenueProps {
  data?: Array<{ period: string, revenue: number, cost: number, profit: number }>;
}

export default function ProfitRevenueChart({ data = [] }: ProfitRevenueProps) {
  const getInsight = () => {
    if (!data.length) return null;
    const last = data[data.length - 1];
    const margin = (last.profit / (last.revenue || 1)) * 100;
    return `Profit Insight: Net margin is currently at ${margin.toFixed(1)}% for the latest period.`;
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50">
        <h3 className="text-xl font-bold tracking-tight">Revenue vs Profit</h3>
        <p className="text-xs text-muted-foreground mt-1">Comparing total sales income with net earnings.</p>
      </div>

      <div className="p-8">
        {!data.length ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No financial history available.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(v) => `₹${v/1000}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`]}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Bar 
                  dataKey="revenue" 
                  name="Total Revenue" 
                  fill="#3b82f6" // Blue
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="profit" 
                  name="Net Profit" 
                  fill="#10b981" // Green
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50/5 border border-emerald-100 dark:border-emerald-900/20">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {getInsight()}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
