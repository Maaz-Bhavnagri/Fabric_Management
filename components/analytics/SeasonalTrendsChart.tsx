'use client';

import { Card } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from 'recharts';

interface SeasonalTrendsProps {
  data?: Array<{ month: string, revenue: number, orders: number }>;
}

export default function SeasonalTrendsChart({ data = [] }: SeasonalTrendsProps) {
  const getInsight = () => {
    if (!data.length) return null;
    const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
    return `Seasonal Insight: ${sorted[0].month} was your peak performing period.`;
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50">
        <h3 className="text-xl font-bold tracking-tight">Seasonal Sales Trends</h3>
        <p className="text-xs text-muted-foreground mt-1">Monthly demand patterns for inventory planning.</p>
      </div>

      <div className="p-8">
        {!data.length ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No trend data available for this range.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(v) => `₹${v/1000}k`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  name="Orders"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ec4899', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
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
