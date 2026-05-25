'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  BadgeCheck, 
  Phone, 
  MapPin, 
  Mail, 
  Plus, 
  History 
} from 'lucide-react';
import { 
  CustomerQuickInfo, 
  CounterCustomerInput, 
  CustomerMeasurementInput 
} from '@/lib/app-types';
import CustomerMeasurementsSection from './CustomerMeasurementsSection';
import { inventoryApi } from '@/lib/api-client';

interface CustomerQuickSectionProps {
  customer: CounterCustomerInput;
  onChange: (customer: CounterCustomerInput) => void;
  onPhoneBlur: () => void;
  quickInfo: CustomerQuickInfo | null;
  walkIn: boolean;
  onWalkInChange: (walkIn: boolean) => void;
  measurement: CustomerMeasurementInput;
  onMeasurementChange: (measurement: CustomerMeasurementInput) => void;
}

export default function CustomerQuickSection({
  customer,
  onChange,
  onPhoneBlur,
  quickInfo,
  walkIn,
  onWalkInChange,
  measurement,
  onMeasurementChange,
}: CustomerQuickSectionProps) {
  const { t } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const selectCustomer = (c: any) => {
    onChange({
      fullName: c.fullName,
      phone: c.phone,
      email: c.email || '',
      city: c.city || '',
      address: c.address || '',
    });
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (customer.fullName.length < 2 || walkIn) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customer.fullName)}`);
        const data = await res.json();
        setSuggestions(data.customers || []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customer.fullName, walkIn]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-foreground tracking-tight">{t('sales.quick.customer')}</h2>
        </div>
        <div className="flex flex-wrap items-center bg-muted/50 p-1 rounded-xl gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onWalkInChange(true)}
            className={`rounded-lg h-9 px-4 text-xs font-bold transition-all ${walkIn ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {t('sales.quick.walkIn')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onWalkInChange(false)}
            className={`rounded-lg h-9 px-4 text-xs font-bold transition-all ${!walkIn && quickInfo ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
            {t('sales.quick.existingCustomer')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onWalkInChange(false)}
            className={`rounded-lg h-9 px-4 text-xs font-bold transition-all ${!walkIn && !quickInfo ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            {t('sales.quick.newCustomer')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="group space-y-2 relative">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
            {t('sales.quick.customerName')}
          </label>
          <div className="relative">
            <Input
              placeholder="Search by name or start typing..."
              value={customer.fullName}
              disabled={walkIn}
              onChange={(e) => {
                onChange({ ...customer, fullName: e.target.value })
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="h-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && !walkIn && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 space-y-1">
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full rounded-xl px-4 py-3 text-left hover:bg-primary/5 transition-colors group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{c.fullName}</div>
                      <div className="text-[11px] text-muted-foreground font-bold flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>
                        {c.city && <span>• {c.city}</span>}
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="group space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
            {t('sales.quick.customerPhone')}
          </label>
          <Input
            placeholder="+91 XXXXX XXXXX"
            value={customer.phone}
            disabled={walkIn}
            inputMode="tel"
            onBlur={onPhoneBlur}
            onChange={(e) => onChange({ ...customer, phone: e.target.value })}
            className="h-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
          />
        </div>

        <div className="group space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
            {t('sales.quick.emailOptional')}
          </label>
          <Input
            placeholder="email@example.com"
            value={customer.email ?? ''}
            disabled={walkIn}
            onChange={(e) => onChange({ ...customer, email: e.target.value })}
            className="h-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
          />
        </div>

        <div className="group space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
            {t('sales.quick.addressOptional')}
          </label>
          <Input
            placeholder="Full address (optional)"
            value={customer.address ?? ''}
            disabled={walkIn}
            onChange={(e) => onChange({ ...customer, address: e.target.value })}
            className="h-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      {!walkIn && quickInfo && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">{t('sales.quick.existingCustomer')}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Orders: {quickInfo.totalOrders}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                Last: {quickInfo.lastOrderDate ? new Date(quickInfo.lastOrderDate).toLocaleDateString() : '-'}
              </span>
              <span className="text-[11px] font-bold text-primary uppercase flex items-center gap-1.5">
                Due: ₹{(quickInfo.outstandingDue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {!walkIn && (
        <div className="pt-2">
          <CustomerMeasurementsSection
            value={measurement}
            onChange={onMeasurementChange}
            disabled={walkIn}
          />
        </div>
      )}
    </section>
  )
}

