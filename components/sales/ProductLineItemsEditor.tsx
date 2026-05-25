'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  Search,
  IndianRupee,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { InventoryRow } from '@/lib/app-types';

interface CounterLineItem {
  fabricVariantId: string;
  searchText: string;
  label: string;
  availableStock: number;
  meters: number;
  ratePerMeter: number;
  stitchingPrice: number;
  isLocked?: boolean;
}

interface ProductLineItemsEditorProps {
  items: CounterLineItem[];
  onChange: (items: CounterLineItem[]) => void;
  suggestions: InventoryRow[];
}

export default function ProductLineItemsEditor({
  items,
  onChange,
  suggestions,
}: ProductLineItemsEditorProps) {
  const { t } = useLanguage();

  const updateAt = (idx: number, patch: Partial<CounterLineItem>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onChange(newItems);
  };

  const addRow = () => {
    onChange([
      ...items,
      {
        fabricVariantId: '',
        searchText: '',
        label: '',
        availableStock: 0,
        meters: 1,
        ratePerMeter: 0,
        stitchingPrice: 0,
        isLocked: false,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  const selectVariant = (idx: number, variant: InventoryRow) => {
    updateAt(idx, {
      fabricVariantId: variant.id,
      searchText: variant.designName,
      label: `${variant.designName} - ${variant.variantName} (${variant.color})`,
      availableStock: variant.stockMeters,
      ratePerMeter: variant.sellingPricePerMeter,
      isLocked: true,
    });
  };

  const parseNumberInput = (val: string, fallback: number) => {
    const p = parseFloat(val);
    return isNaN(p) ? 0 : p;
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Plus className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-foreground tracking-tight">{t('sales.quick.products')}</h2>
        </div>
        <Button
          type="button"
          onClick={addRow}
          className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('sales.quick.addItem')}
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const fabricTotal = item.meters * item.ratePerMeter
          const lineTotal = fabricTotal + item.stitchingPrice
          return (
            <Card key={`${index}-${item.fabricVariantId}`} className="group relative overflow-hidden border-border bg-slate-50/30 dark:bg-slate-900/10 p-5 rounded-2xl transition-all hover:shadow-md">

              <div className="grid gap-6 md:grid-cols-12 items-start">
                {/* Product search */}
                <div className="md:col-span-5 space-y-2 relative group-item">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                    {t('sales.quick.productFieldLabel', 'Fabric / Product')}
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={t('sales.quick.searchProduct')}
                      value={item.searchText}
                      onChange={(e) => updateAt(index, { searchText: e.target.value })}
                      disabled={item.isLocked}
                      hideSpeech
                      className="h-11 rounded-xl border-border bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 transition-all pr-4"
                    />
                    {!item.isLocked && item.searchText.trim().length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-1.5 space-y-1">
                          {suggestions.slice(0, 8).map((variant) => (
                            <button
                              key={`${index}-${variant.id}`}
                              type="button"
                              onClick={() => selectVariant(index, variant)}
                              className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-primary/5 transition-colors group flex flex-col"
                            >
                              <div className="text-sm font-black text-foreground">{variant.designName} - {variant.variantName}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">{variant.color}</span>
                                <span className="text-[10px] font-bold text-primary uppercase">₹{variant.sellingPricePerMeter}/m</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase ml-auto">Stock: {variant.stockMeters}m</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {item.label && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">{item.label}</span>
                    </div>
                  )}
                </div>

                {/* Meters */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('sales.quick.meters')}</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.meters}
                    onChange={(e) => updateAt(index, { meters: parseNumberInput(e.target.value, item.meters) })}
                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                    disabled={item.isLocked}
                    className="h-11 rounded-xl border-border bg-white dark:bg-slate-950 text-center font-black"
                  />
                  <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-muted-foreground uppercase tracking-widest w-fit mx-auto">
                    Stock: {item.availableStock}m
                  </div>
                </div>

                {/* Rate */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('sales.quick.ratePerMeter')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.ratePerMeter}
                      onChange={(e) => updateAt(index, { ratePerMeter: parseNumberInput(e.target.value, item.ratePerMeter) })}
                      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                      disabled={item.isLocked}
                      className="h-11 pl-7 rounded-xl border-border bg-white dark:bg-slate-950 font-black"
                    />
                  </div>
                </div>

                {/* Stitching */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stitching (₹)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.stitchingPrice}
                    onChange={(e) => updateAt(index, { stitchingPrice: parseNumberInput(e.target.value, item.stitchingPrice) })}
                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                    disabled={item.isLocked}
                    className="h-11 rounded-xl border-border bg-white dark:bg-slate-950 font-black text-purple-600 dark:text-purple-400"
                  />
                </div>

                {/* Remove Button - Desktop only here */}
                <div className="hidden md:flex flex-col justify-end h-full mb-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeRow(index)}
                    disabled={items.length === 1}
                    className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action row & Line Total footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={item.isLocked ? 'outline' : 'default'}
                    onClick={() => updateAt(index, { isLocked: !item.isLocked })}
                    disabled={!item.fabricVariantId}
                    className={`rounded-xl h-9 px-6 font-bold gap-2 transition-all ${item.isLocked ? 'border-primary/20 text-primary hover:bg-primary/5' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10'}`}
                  >
                    {item.isLocked ? (
                      <><Pencil className="h-3.5 w-3.5" /> {t('sales.quick.editItem', 'Modify')}</>
                    ) : (
                      <><Check className="h-3.5 w-3.5" /> {t('sales.quick.addProductButton', 'Confirm')}</>
                    )}
                  </Button>

                  <div className="md:hidden">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(index)}
                      disabled={items.length === 1}
                      className="h-9 w-9 p-0 text-red-500 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Line Subtotal</span>
                    <span className="text-lg font-black text-foreground">₹{lineTotal.toFixed(2)}</span>
                  </div>
                  {item.stitchingPrice > 0 && (
                    <div className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                      Fabric ₹{fabricTotal.toFixed(0)} + Stitching ₹{item.stitchingPrice.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
