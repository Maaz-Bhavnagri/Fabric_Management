'use client'

import { Input } from '@/components/ui/input'
import { useLanguage } from '@/context/LanguageContext'
import { Card } from '@/components/ui/card'
import { 
  ReceiptIndianRupee, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Split, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Percent
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BillingSummaryPanelProps {
  fabricTotal: number
  stitchingTotal: number
  discount: number
  advancePaid: number
  lineItems?: Array<{
    label: string
    meters: number
    ratePerMeter: number
    stitchingPrice: number
    discount: number
    lineTotal: number
  }>
  paymentMethod: 'cash' | 'upi' | 'card' | 'mixed'
  paymentStatus: 'paid' | 'pending'
  onDiscountChange: (value: number) => void
  onAdvancePaidChange: (value: number) => void
  onPaymentMethodChange: (value: 'cash' | 'upi' | 'card' | 'mixed') => void
  onPaymentStatusChange: (value: 'paid' | 'pending') => void
}

export default function BillingSummaryPanel({
  fabricTotal,
  stitchingTotal,
  discount,
  advancePaid,
  lineItems = [],
  paymentMethod,
  paymentStatus,
  onDiscountChange,
  onAdvancePaidChange,
  onPaymentMethodChange,
  onPaymentStatusChange,
}: BillingSummaryPanelProps) {
  const { t } = useLanguage()
  const subtotal = fabricTotal + stitchingTotal
  const grandTotal = Math.max(0, subtotal - discount)
  const dueAmount = Math.max(0, grandTotal - advancePaid)
  const discountPercent = subtotal > 0 ? ((discount / subtotal) * 100).toFixed(1) : '0.0'

  const parseNumberInput = (raw: string, current: number) => {
    const value = raw.trim()
    if (value === '') return 0
    if (!/^\d*\.?\d*$/.test(value)) return current
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : current
  }

  return (
    <section className="space-y-8">
      {/* Payment Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ReceiptIndianRupee className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight">{t('sales.quick.billing')}</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="group space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors flex items-center justify-between">
                Discount
                {discount > 0 && (
                  <span className="text-emerald-500 font-bold">{discountPercent}%</span>
                )}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={discount}
                onChange={(e) => onDiscountChange(parseNumberInput(e.target.value, discount))}
                className="h-11 rounded-xl border-border bg-slate-50 dark:bg-slate-900 font-black pr-4"
                placeholder="0"
              />
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                Advance
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={advancePaid}
                onChange={(e) => onAdvancePaidChange(parseNumberInput(e.target.value, advancePaid))}
                className="h-11 rounded-xl border-border bg-slate-50 dark:bg-slate-900 font-black"
                placeholder="₹ 0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                Method
              </label>
              <Select value={paymentMethod} onValueChange={(v) => onPaymentMethodChange(v as any)}>
                <SelectTrigger className="h-11 rounded-xl border-border bg-slate-50 dark:bg-slate-900 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cash"><div className="flex items-center gap-2"><Banknote className="w-3.5 h-3.5 text-emerald-500" /> Cash</div></SelectItem>
                  <SelectItem value="upi"><div className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-blue-500" /> UPI</div></SelectItem>
                  <SelectItem value="card"><div className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-purple-500" /> Card</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                Status
              </label>
              <Select value={paymentStatus} onValueChange={(v) => onPaymentStatusChange(v as any)}>
                <SelectTrigger className={`h-11 rounded-xl border-border font-bold ${paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent rounded-xl>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Summary Card */}
      <Card className="rounded-3xl border-border bg-slate-50/30 dark:bg-slate-900/10 overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-border/50 bg-white dark:bg-slate-900 flex items-center justify-between">
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest italic">Summary</h4>
          <ShieldCheck className="w-4 h-4 text-primary/40" />
        </div>

        <div className="max-h-[220px] overflow-auto px-6 py-4 space-y-3">
          {lineItems.length > 0 ? (
            lineItems.map((it, idx) => (
              <div key={`${it.label}-${idx}`} className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-foreground truncate">{it.label}</div>
                  <div className="text-[9px] text-muted-foreground font-black uppercase">₹{it.ratePerMeter} × {it.meters}m</div>
                </div>
                <div className="text-[11px] font-black text-foreground">₹{it.lineTotal.toFixed(0)}</div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-[10px] font-black uppercase text-muted-foreground opacity-40">No Items Added</div>
          )}
        </div>

        {/* Totals Section */}
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-border/50 space-y-3">
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-black text-muted-foreground uppercase tracking-widest opacity-60">Subtotal</span>
              <span className="font-black text-foreground">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-black text-emerald-600 uppercase tracking-widest">Discount</span>
                <span className="font-black text-emerald-600">− ₹{discount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t-2 border-dashed border-border flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-foreground uppercase tracking-wider italic">Grand Total</span>
              <span className="text-3xl font-black text-primary tracking-tighter">₹{grandTotal.toLocaleString()}</span>
            </div>

            <div className={`grid ${advancePaid > 0 && dueAmount > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {advancePaid > 0 && (
                <div className="p-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <span className="block text-[8px] font-black text-emerald-600/70 uppercase tracking-widest mb-0.5">Paid</span>
                  <span className="text-sm font-black text-emerald-600">₹{advancePaid.toLocaleString()}</span>
                </div>
              )}
              {dueAmount > 0 && (
                <div className="p-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Due</span>
                  <span className="text-sm font-black text-amber-600">₹{dueAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
