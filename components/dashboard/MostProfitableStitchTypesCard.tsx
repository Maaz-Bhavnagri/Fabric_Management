'use client';

import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, Scissors } from 'lucide-react';
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

interface MostProfitableStitchTypesCardProps {
  data?: Array<{ stitchType: string; profit: number }>;
}

export default function MostProfitableStitchTypesCard({ data = [] }: MostProfitableStitchTypesCardProps) {
  const { t } = useLanguage();

  return (
    <Card className="bg-card border-none shadow-md shadow-black/5 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Most Profitable</h3>
            <p className="text-xs text-muted-foreground">Top stitching margins</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            No profit data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="stitchType" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 'bold' }} 
              />
              <Tooltip 
                cursor={{ fill: 'var(--muted)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Profit']}
              />
              <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : 'rgba(var(--primary), 0.5)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
