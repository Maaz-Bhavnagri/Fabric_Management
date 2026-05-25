'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  ShoppingCart, 
  IndianRupee, 
  Hash, 
  Info,
  Layers,
  Ruler,
  Sparkles,
  Zap,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface CreateOrderModalProps {
  onClose: () => void;
  onCreate: (order: {
    invoiceNumber: string;
    subtotal: number;
    discount?: number;
    tax?: number;
    grandTotal?: number;
    paymentMethod: string;
    paymentStatus: string;
    notes?: string;
    items: Array<{
      fabricVariantId: string;
      meters: number;
      ratePerMeter: number;
    }>;
  }) => Promise<void>;
}

export default function CreateOrderModal({ onClose, onCreate }: CreateOrderModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    fabricVariantId: '',
    meters: '1',
    ratePerMeter: '0',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const meters = parseFloat(formData.meters);
      const ratePerMeter = parseFloat(formData.ratePerMeter);
      const subtotal = meters * ratePerMeter;
      await onCreate({
        invoiceNumber: formData.invoiceNumber,
        subtotal,
        discount: 0,
        tax: 0,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes || undefined,
        items: [
          {
            fabricVariantId: formData.fabricVariantId,
            meters,
            ratePerMeter,
          },
        ],
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-10 pt-10 pb-8 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground italic">
                {t('sales.createOrder')}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic">
                New Transaction Record
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-8">
          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 flex items-start gap-4 animate-in shake-in duration-300">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm font-black text-destructive leading-tight py-1">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {/* Financial Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Financials</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-amber-500 transition-colors ml-1">
                  Invoice Number
                </Label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Status
                  </Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-none bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                      <SelectItem value="paid" className="rounded-xl">{t('sales.paid')}</SelectItem>
                      <SelectItem value="pending" className="rounded-xl">{t('sales.pending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Method
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-none bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                      <SelectItem value="cash" className="rounded-xl">Cash Only</SelectItem>
                      <SelectItem value="card" className="rounded-xl">Card Swipe</SelectItem>
                      <SelectItem value="upi" className="rounded-xl">UPI / QR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-amber-500 transition-colors ml-1">
                  Fabric Variant Identifier
                </Label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    value={formData.fabricVariantId}
                    onChange={(e) => setFormData({ ...formData, fabricVariantId: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    placeholder="Variant UID..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Quantity & Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Volume</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-amber-500 transition-colors ml-1">
                    Qty (Mtrs)
                  </Label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={formData.meters}
                      onChange={(e) => setFormData({ ...formData, meters: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-amber-500 transition-colors ml-1">
                    Rate / Mtr
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={formData.ratePerMeter}
                      onChange={(e) => setFormData({ ...formData, ratePerMeter: e.target.value })}
                      className="h-12 pl-10 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-amber-500 transition-colors ml-1">
                  Internal Notes
                </Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3 w-4 h-4 text-muted-foreground/30 group-focus-within:text-amber-500 transition-colors" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full min-h-[100px] pl-12 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/10 border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner resize-none"
                    placeholder="Customer requirements..."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-8 border-t border-border/50 gap-4 flex-col sm:flex-row">
            <div className="flex-1 hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Digital Invoice will be generated</span>
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
              className="rounded-2xl h-14 px-12 font-black italic shadow-2xl shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isLoading ? t('common.loading') : (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  Authorize Order
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
