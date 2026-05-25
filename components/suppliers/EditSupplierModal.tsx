'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { SupplierRow } from '@/lib/app-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Pencil,
  Hash,
  Zap,
  ShieldCheck,
  BadgeCheck,
  Truck
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface EditSupplierModalProps {
  supplier: SupplierRow;
  onClose: () => void;
  onSave: (updates: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    gstin?: string;
    paymentTerms?: string;
  }) => Promise<void>;
}

export default function EditSupplierModal({
  supplier,
  onClose,
  onSave,
}: EditSupplierModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: supplier.name ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    city: supplier.city ?? '',
    gstin: supplier.gstin ?? '',
    paymentTerms: supplier.paymentTerms ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        city: formData.city || undefined,
        gstin: formData.gstin || undefined,
        paymentTerms: formData.paymentTerms || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-10 pt-10 pb-8 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <Pencil className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground italic">
                {t('common.edit')} Supplier
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic flex items-center gap-2">
                 <span className="font-black text-indigo-500">Global ID: {supplier.id.slice(0, 8)}</span>
                 <span className="w-1 h-1 rounded-full bg-border" />
                 {supplier.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Business Core</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  {t('suppliers.name')}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  GSTIN Registry
                </Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black uppercase shadow-inner"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  Payment Architecture
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-indigo-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Contact points</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  {t('suppliers.phone')}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  {t('suppliers.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  {t('suppliers.city')}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-8 border-t border-border/50 gap-4 flex-col sm:flex-row">
            <div className="flex-1 hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">System Integrity Verified</span>
            </div>
            
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border-2"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl h-14 px-12 font-black italic shadow-2xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isLoading ? 'Syncing...' : (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  Apply Updates
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

