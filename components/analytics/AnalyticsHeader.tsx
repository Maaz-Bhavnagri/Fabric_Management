'use client';

import { Button } from '@/components/ui/button';
import { 
  Download, 
  Filter, 
  Calendar, 
  FileText, 
  Share2,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsHeaderProps {
  range: string;
  onRangeChange: (range: string) => void;
  onExport: () => void;
}

export default function AnalyticsHeader({ range, onRangeChange, onExport }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">
              Business Intelligence
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Advanced Store Performance Analytics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-border flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Real-time Insights</span>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Range</span>
            </div>
            <Select value={range} onValueChange={onRangeChange}>
              <SelectTrigger className="w-[140px] h-9 border-none bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-tight focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent rounded-xl>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="1y">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={onExport}
            className="h-12 px-6 rounded-2xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-black italic shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>
    </div>
  );
}
