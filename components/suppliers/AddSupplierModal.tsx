'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
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
  FileText,
  CreditCard,
  CheckCircle2,
  PlusCircle,
  Hash,
  Truck,
  Sparkles,
  Info,
  BadgeCheck
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (supplier: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    gstin?: string;
    paymentTerms?: string;
  }) => Promise<void>;
}

export default function AddSupplierModal({ isOpen, onClose, onAdd }: AddSupplierModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    gstin: '',
    paymentTerms: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAdd({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        gstin: formData.gstin || undefined,
        paymentTerms: formData.paymentTerms || undefined,
      });
    } catch (error: unknown) {
      // Show detailed error message instead of silently closing
      const errorMessage = error instanceof Error ? error.message : 'Failed to add supplier';
      toast({
        title: 'Error Adding Supplier',
        description: errorMessage,
        variant: 'destructive'
      });
      // Don't close the modal on error so user can fix the issues
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-10 pt-10 pb-8 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground italic">
                {t('suppliers.addSupplier')}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic">
                Strategic Partner Onboarding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {/* Enterprise Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Business Identity</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  Company Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    placeholder="e.g. Royal Silks Inc."
                    required
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  GSTIN Registry
                </Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black uppercase shadow-inner"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                    Direct Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                      placeholder="contact@enterprise.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics & Location */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Headquarters</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  Registered City
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    placeholder="e.g. Surat, Gujarat"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  Full Logistics Address
                </Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full min-h-[100px] pl-12 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/10 border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner resize-none"
                    placeholder="Complete business premise details..."
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1 flex items-center gap-2">
                  Payment Terms
                  <Info className="w-3 h-3 opacity-30" />
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    placeholder="e.g. Net 30, Advance 50%"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-8 border-t border-border/50 gap-4 flex-col sm:flex-row">
            <div className="flex-1 hidden sm:block">
              <div className="flex items-center gap-2 text-muted-foreground opacity-30">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Onboarded partners enjoy priority logistics</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border-2"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl h-14 px-12 font-black italic shadow-2xl shadow-primary/20 bg-primary text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all text-white"
            >
              {isLoading ? t('common.loading') : (
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-5 h-5" />
                  Onboard Supplier
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

