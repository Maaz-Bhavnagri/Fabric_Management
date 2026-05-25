'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';

interface TopSellingFabricsProps {
  data?: Array<{ name: string, meters: number, revenue: number, orders: number }>;
}

export default function TopSellingFabrics({ data = [] }: TopSellingFabricsProps) {
  const [metric, setMetric] = useState<'revenue' | 'meters' | 'orders'>('revenue');

  const formattedData = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 7);

  const getMetricLabel = () => {
    switch(metric) {
      case 'revenue': return 'Revenue (₹)';
      case 'meters': return 'Meters Sold';
      case 'orders': return 'Total Orders';
    }
  };

  const getInsight = () => {
    if (!data.length) return null;
    const top = formattedData[0];
    return `Insight: ${top.name} is your highest ${metric} generator this period.`;
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Top Selling Fabrics</h3>
          <p className="text-xs text-muted-foreground mt-1">Products generating the highest sales metrics.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['revenue', 'meters', 'orders'] as const).map((m) => (
            <Button
              key={m}
              variant="ghost"
              size="sm"
              onClick={() => setMetric(m)}
              className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                metric === m 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {!data.length ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">Insufficient sales data yet.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                layout="vertical"
                data={formattedData}
                margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [
                    metric === 'revenue' ? `₹${value.toLocaleString()}` : value,
                    getMetricLabel()
                  ]}
                />
                <Bar 
                  dataKey={metric} 
                  radius={[0, 8, 8, 0]} 
                  barSize={30}
                >
                  {formattedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'var(--primary)' : 'rgba(var(--primary-rgb), 0.2)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-bold text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {getInsight()}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
