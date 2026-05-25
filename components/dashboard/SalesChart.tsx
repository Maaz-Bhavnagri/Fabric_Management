'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface SalesChartProps {
  data?: Array<{ name: string; value: number }>;
}

const COLORS = [
  'oklch(0.65 0.18 245)', // Primary Blue
  'oklch(0.7 0.15 160)',  // Teal/Green
  'oklch(0.6 0.18 25)',   // Red/Pink
  'oklch(0.85 0.15 80)',  // Yellow/Orange
  'oklch(0.6 0.15 320)',  // Purple
  'oklch(0.75 0.12 210)', // Light Blue
];

export default function SalesChart({ data = [] }: SalesChartProps) {
  const { t } = useLanguage();

  // Fallback if no data
  const chartData = data.length > 0 ? data : [
    { name: 'No Sales Yet', value: 1 }
  ];

  return (
    <Card className="bg-card border-none shadow-md shadow-black/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">
          {t('dashboard.salesDistribution')}
        </h3>
        <p className="text-xs text-muted-foreground">Product category breakdown</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={data.length > 0 ? COLORS[index % COLORS.length] : 'oklch(0.9 0 0)'} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
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
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-xs font-medium text-muted-foreground px-2">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
