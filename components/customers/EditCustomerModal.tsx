'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { CustomerRow } from '@/lib/app-types';
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
import { User, Mail, Phone, MapPin, CheckCircle2, UserCircle, Zap, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface EditCustomerModalProps {
  customer: CustomerRow;
  onClose: () => void;
  onSave: (updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
  }) => Promise<void>;
}

export default function EditCustomerModal({
  customer,
  onClose,
  onSave,
}: EditCustomerModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: customer.fullName ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    city: customer.city ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        city: formData.city || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-10 pt-10 pb-8 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <UserCircle className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground italic">
                {t('common.edit')} Profile
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic flex items-center gap-2">
                 <span className="font-black text-indigo-500">Record #{customer.id.slice(-6)}</span>
                 <span className="w-1 h-1 rounded-full bg-border" />
                 {customer.fullName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-8">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Identity Update</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  {t('customers.name')}
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-14 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold text-lg shadow-inner focus-visible:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                    {t('customers.phone')}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                    {t('customers.city')}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                      placeholder="Surat"
                    />
                  </div>
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  {t('customers.email')}
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
            </div>
          </div>

          <DialogFooter className="pt-8 border-t border-border/50 gap-4 flex-col sm:flex-row">
            <div className="flex-1 hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Identity Verification Active</span>
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
                  <UserCheck className="w-5 h-5" />
                  Commit Updates
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
