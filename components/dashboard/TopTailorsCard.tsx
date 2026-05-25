'use client';

import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { Users, CheckCircle2, IndianRupee } from 'lucide-react';
import { useTheme } from 'next-themes';

interface TopTailorsCardProps {
  data?: Array<{ tailorName: string; totalPayout: number; assignedItems: number; completionCount: number }>;
}

export default function TopTailorsCard({ data = [] }: TopTailorsCardProps) {
  const { t } = useLanguage();

  return (
    <Card className="bg-card border-none shadow-md shadow-black/5 p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Top Tailors</h3>
          <p className="text-xs text-muted-foreground">Ranked by total payouts</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {data.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No tailor assignments in this period.
          </div>
        ) : (
          data.map((tailor, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-xs shrink-0">
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{tailor.tailorName}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {tailor.assignedItems} items</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ₹{tailor.totalPayout.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-muted-foreground font-medium">Payout</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
