'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useTheme } from 'next-themes';

interface RevenueChartProps {
  data?: Array<{ period: string; revenue: number; profit: number }>;
}

export default function RevenueChart({ data = [] }: RevenueChartProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';

  return (
    <Card className="bg-card border-none shadow-md shadow-black/5 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {t('dashboard.revenueChart')}
          </h3>
          <p className="text-xs text-muted-foreground">Monthly performance overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">Profit</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} 
          />
          <XAxis 
            dataKey="period" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: 'none',
              borderRadius: '1rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ fontWeight: 'bold' }}
            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--primary)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="rgb(16, 185, 129)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorProfit)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
