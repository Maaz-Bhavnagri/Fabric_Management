'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { InventoryRow } from '@/lib/app-types';
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
  Pencil, 
  IndianRupee, 
  Box, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  PackageSearch, 
  ShieldCheck,
  Palette,
  Image as ImageIcon,
  Upload,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditFabricModalProps {
  fabric: InventoryRow;
  onClose: () => void;
  onSave: (updates: {
    name?: string;
    category?: string;
    color?: string;
    sellingPricePerMeter?: number;
    purchasePricePerMeter?: number;
    stockMeters?: number;
    lowStockThreshold?: number;
    imageUrl?: string;
    googleDriveFileId?: string;
  }) => Promise<void>;
}

export default function EditFabricModal({ fabric, onClose, onSave }: EditFabricModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: fabric.designName,
    category: fabric.category,
    color: fabric.color,
    sellingPricePerMeter: String(fabric.sellingPricePerMeter ?? ''),
    purchasePricePerMeter: String(fabric.purchasePricePerMeter ?? ''),
    stockMeters: String(fabric.stockMeters ?? ''),
    lowStockThreshold: String(fabric.lowStockThreshold ?? 10),
    imageUrl: fabric.imageUrl || '',
    googleDriveFileId: fabric.googleDriveFileId || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories');
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append('file', file);
    body.append('fabricName', formData.name || 'Updated_Fabric');

    try {
      const res = await fetch('/api/inventory/upload', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (json.success) {
        setFormData(prev => ({
          ...prev,
          imageUrl: json.data.imageUrl,
          googleDriveFileId: json.data.googleDriveFileId
        }));
      }
    } catch (err) {
      console.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onSave({
        name: formData.name,
        category: formData.category,
        color: formData.color,
        sellingPricePerMeter: parseFloat(formData.sellingPricePerMeter || '0'),
        purchasePricePerMeter: parseFloat(formData.purchasePricePerMeter || '0'),
        stockMeters: parseFloat(formData.stockMeters || '0'),
        lowStockThreshold: parseFloat(formData.lowStockThreshold || '10'),
        imageUrl: formData.imageUrl,
        googleDriveFileId: formData.googleDriveFileId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-8 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-[1rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <Pencil className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">
                Edit Product
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                 System Update Protocol
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-xs font-black text-destructive leading-tight">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Identity</h4>
              </div>

              <div className="group space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  Product Name
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                  required
                />
              </div>

              <div className="group space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  Category
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner flex-1"
                    required
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      {categories.map(cat => (
                        <DropdownMenuItem key={cat} onClick={() => setFormData({ ...formData, category: cat })} className="font-bold text-sm py-2 px-3 rounded-lg cursor-pointer">
                          {cat}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="group space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  Color
                </Label>
                <div className="relative">
                  <Palette className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 pl-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Financials</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Purchase</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      type="number"
                      value={formData.purchasePricePerMeter}
                      onChange={(e) => setFormData({ ...formData, purchasePricePerMeter: e.target.value })}
                      className="h-10 pl-8 rounded-xl font-black shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Selling</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      type="number"
                      value={formData.sellingPricePerMeter}
                      onChange={(e) => setFormData({ ...formData, sellingPricePerMeter: e.target.value })}
                      className="h-10 pl-8 rounded-xl font-black shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Stock</Label>
                  <Input
                    type="number"
                    value={formData.stockMeters}
                    onChange={(e) => setFormData({ ...formData, stockMeters: e.target.value })}
                    className="h-10 rounded-xl font-black shadow-inner"
                    required
                  />
                </div>
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Alert Level</Label>
                  <Input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="h-10 rounded-xl font-black shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-indigo-500/50" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Digital Metadata</h4>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 flex items-center justify-center gap-4 transition-all cursor-pointer group ${formData.imageUrl ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-border/60 hover:border-indigo-500/40 hover:bg-slate-50/50'}`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              ) : formData.imageUrl ? (
                <div className="flex items-center gap-4 w-full justify-center">
                  <img src={formData.imageUrl} className="w-16 h-16 rounded-xl object-cover shadow-md relative group-hover:scale-105 transition-transform" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-emerald-500 mb-0.5">
                      <Check className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Linked to Drive</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-0 text-[10px] text-red-500 hover:bg-transparent" onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, imageUrl: '', googleDriveFileId: '' });
                    }}>
                      Remove Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-foreground block">Update Image</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Tap to browse files</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-border/50 gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-border/60 border-2"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="rounded-xl h-12 px-8 font-black italic shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] tracking-tight hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isLoading ? 'Syncing...' : 'Commit Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
