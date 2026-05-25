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

interface CustomerRetentionProps {
  data?: { new: number, repeat: number, rate: number };
}

export default function CustomerRetentionChart({ data }: CustomerRetentionProps) {
  const chartData = [
    { name: 'New Customers', value: data?.new || 0, color: 'rgba(var(--primary-rgb), 0.2)' },
    { name: 'Repeat Customers', value: data?.repeat || 0, color: 'var(--primary)' }
  ];

  const getInsight = () => {
    if (!data) return null;
    return `Customer Insight: ${data.rate.toFixed(1)}% of your customers are repeat buyers.`;
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-8 border-b border-border/50">
        <h3 className="text-xl font-bold tracking-tight">Customer Retention</h3>
        <p className="text-xs text-muted-foreground mt-1">Returning vs first-time visiting customers.</p>
      </div>

      <div className="p-8">
        {!data || (data.new === 0 && data.repeat === 0) ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No customer data to analyze yet.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
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
