'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Store, 
  Bell, 
  ShieldCheck, 
  Globe, 
  IndianRupee, 
  Percent, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter italic">
              {t('settings.title')}
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic">Configure your digital workspace</p>
          </div>
        </div>
        {saved && (
          <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">{t('settings.settingsSaved')}</p>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Store Management Section */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 overflow-hidden group hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-foreground italic">
              {t('settings.storeInfo')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group space-y-2">
              <label
                htmlFor="settings-currency"
                className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1"
              >
                {t('settings.currency')}
              </label>
              <Select defaultValue="INR">
                <SelectTrigger
                  id="settings-currency"
                  className="h-12 bg-slate-100/50 dark:bg-slate-800/10 border-none rounded-2xl font-bold shadow-inner px-4 focus:ring-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                  <SelectItem value="INR" className="rounded-xl">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD" className="rounded-xl">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR" className="rounded-xl">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="group space-y-2">
              <label
                htmlFor="settings-tax-rate"
                className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1"
              >
                {t('settings.taxRate')} (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                <Input
                  id="settings-tax-rate"
                  type="number"
                  inputMode="decimal"
                  placeholder="18"
                  className="h-12 pl-12 bg-slate-100/50 dark:bg-slate-800/10 border-none rounded-2xl font-black shadow-inner focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications & Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 group hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-foreground italic">
                {t('settings.notifications')}
              </h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-border/50 cursor-pointer hover:bg-slate-100/50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{t('settings.emailNotifications')}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Daily Reports & Alerts</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded-lg border-border bg-white text-primary focus:ring-primary/20"
                />
              </label>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 group hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-foreground italic">
                Platform Security
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/10">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Two-Factor Auth</span>
                  <span className="text-[10px] text-emerald-600/60 font-medium uppercase tracking-tighter">Highly Recommended</span>
                </div>
                <Button size="sm" variant="outline" className="h-8 rounded-xl border-emerald-500/20 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-white dark:bg-transparent">
                  Enable
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Global Action Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-2 text-muted-foreground opacity-30">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Global settings apply to all store branches</span>
          </div>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto h-14 px-12 rounded-2xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-black shadow-2xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            Commit Configuration
            <ArrowRight className="w-5 h-5 ml-2 opacity-50" />
          </Button>
        </div>
      </div>
    </div>
  );
}
