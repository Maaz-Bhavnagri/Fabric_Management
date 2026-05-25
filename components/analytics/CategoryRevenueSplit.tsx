'use client';

import { Card } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

interface CategoryRevenueProps {
  data?: Array<{ name: string, value: number, percentage: number }>;
}

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
];

export default function CategoryRevenueSplit({ data = [] }: CategoryRevenueProps) {
  const getInsight = () => {
    if (!data.length) return null;
    const top = [...data].sort((a, b) => b.value - a.value)[0];
    return `Revenue Insight: ${top.name} contributes ${top.percentage.toFixed(1)}% of total revenue.`;
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50">
        <h3 className="text-xl font-bold tracking-tight">Revenue by Category</h3>
        <p className="text-xs text-muted-foreground mt-1">Income share across different fabric types.</p>
      </div>

      <div className="p-8">
        {!data.length ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No category data found.</p>
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
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
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
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                      {value} ({entry.payload.percentage.toFixed(1)}%)
                    </span>
                  )}
                />
              </PieChart>
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
