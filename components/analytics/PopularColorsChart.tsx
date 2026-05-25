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
  Cell
} from 'recharts';

interface PopularColorsProps {
  data?: Array<{ color: string, meters: number, revenue: number }>;
}

export default function PopularColorsChart({ data = [] }: PopularColorsProps) {
  const getInsight = () => {
    if (!data.length) return null;
    const top = [...data].sort((a, b) => b.revenue - a.revenue)[0];
    return `Color Insight: ${top.color} fabrics are most preferred this period.`;
  };

  // Helper to map color names to CSS values
  const getFillColor = (colorName: string) => {
    const name = colorName.toLowerCase();
    const common: Record<string, string> = {
      'blue': '#3b82f6',
      'red': '#ef4444',
      'green': '#10b981',
      'yellow': '#f59e0b',
      'black': '#1e293b',
      'white': '#f8fafc',
      'pink': '#ec4899',
      'purple': '#8b5cf6',
      'indigo': '#6366f1',
      'gray': '#64748b',
      'grey': '#64748b',
      'orange': '#f97316',
    };
    return common[name] || 'var(--primary)';
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50">
        <h3 className="text-xl font-bold tracking-tight">Popular Fabric Colors</h3>
        <p className="text-xs text-muted-foreground mt-1">Colors customers purchase the most by revenue.</p>
      </div>

      <div className="p-8">
        {!data.length ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No color data recorded yet.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="color" 
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
                  itemStyle={{ textTransform: 'capitalize' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getFillColor(entry.color)} 
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/5 border border-indigo-100 dark:border-indigo-900/20">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {getInsight()}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
