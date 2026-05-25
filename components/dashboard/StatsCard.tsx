'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-none shadow-md shadow-black/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group cursor-default",
      className
    )}>
      {/* Background Accent */}
      <div className={cn(
        "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500",
        color.split(' ')[0] // Pick the background color part
      )} />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-300 group-hover:scale-110",
            color
          )}>
            {icon}
          </div>
          {subtitle && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {subtitle}
            </span>
          )}
        </div>
        
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{value}</h2>
        </div>
      </div>
      
      {/* Bottom Progress Indicator (Subtle Decoration) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
        <div className={cn(
          "h-full w-1/3 opacity-50 rounded-r-full",
          color.split(' ')[0]
        )} />
      </div>
    </Card>
  );
}
