'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import imageCompression from 'browser-image-compression';
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
  Package, 
  PlusCircle, 
  IndianRupee, 
  Palette, 
  Sparkles,
  Warehouse,
  AlertTriangle,
  Info,
  TrendingUp,
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
} from "@/components/ui/dropdown-menu";
import { useCameraContext } from '@/context/CameraContext';
import MobileCameraButton from '@/components/camera/MobileCameraButton';
import { useAuth } from '@/context/AuthContext';

interface AddFabricModalProps {
  onClose: () => void;
  onAdd: (fabric: {
    name: string;
    category: string;
    color: string;
    purchasePricePerMeter: number;
    sellingPricePerMeter: number;
    stockMeters: number;
    minStockLevel: number;
    imageUrl?: string;
  }) => Promise<void>;
}

export default function AddFabricModal({
  onClose,
  onAdd,
}: AddFabricModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    color: '',
    purchasePricePerMeter: '',
    sellingPricePerMeter: '',
    stockMeters: '',
    minStockLevel: '10',
    imageUrl: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deviceStatus } = useCameraContext();
  const { user } = useAuth();
  const adminUserId = user?.id || '';

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
    
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.7,
      };
      const compressedBlob = await imageCompression(file, options);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });

      const body = new FormData();
      body.append('file', compressedFile);
      body.append('fabricName', formData.name || 'New_Fabric');

      const res = await fetch('/api/inventory/upload', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (json.success) {
        setFormData(prev => ({
          ...prev,
          imageUrl: json.data.imageUrl
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
    setIsLoading(true);

    try {
      await onAdd({
        name: formData.name,
        category: formData.category,
        color: formData.color,
        purchasePricePerMeter: parseFloat(formData.purchasePricePerMeter || '0'),
        sellingPricePerMeter: parseFloat(formData.sellingPricePerMeter || '0'),
        stockMeters: parseFloat(formData.stockMeters || '0'),
        minStockLevel: parseFloat(formData.minStockLevel || '10'),
        imageUrl: formData.imageUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add product. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-8 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-[1rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">
                {t('inventory.addFabric')}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                New Product Onboarding
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
            {/* Identity Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Identity</h4>
              </div>
              
              <div className="group space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  Product Name
                </Label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 pl-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    placeholder="e.g. Italian Mulberry Silk"
                    required
                  />
                </div>
              </div>

              <div className="group space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  Category
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                      placeholder="e.g. Silk, Cotton..."
                      required
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      {categories.length > 0 ? (
                        categories.map(cat => (
                          <DropdownMenuItem 
                            key={cat} 
                            onClick={() => setFormData({ ...formData, category: cat })}
                            className="font-bold text-sm py-2 px-3 rounded-lg cursor-pointer"
                          >
                            {cat}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-4 text-[10px] font-black uppercase text-muted-foreground opacity-40 text-center">No categories yet</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="group space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                  Color / Shade
                </Label>
                <div className="relative">
                  <Palette className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 pl-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                    placeholder="e.g. Royal Blue"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Inventory Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="w-4 h-4 text-primary/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Logistics</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1 flex items-center justify-between">
                    Purchase
                    <Info className="w-3 h-3 opacity-30" />
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={formData.purchasePricePerMeter}
                      onChange={(e) => setFormData({ ...formData, purchasePricePerMeter: e.target.value })}
                      className="h-10 pl-8 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1 flex items-center justify-between">
                    Selling
                    <TrendingUp className="w-3 h-3 opacity-30 text-emerald-500" />
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={formData.sellingPricePerMeter}
                      onChange={(e) => setFormData({ ...formData, sellingPricePerMeter: e.target.value })}
                      className="h-10 pl-8 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1">
                    Initial Stock
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={formData.stockMeters}
                      onChange={(e) => setFormData({ ...formData, stockMeters: e.target.value })}
                      className="h-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black pr-10 shadow-inner"
                      placeholder="0.0"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground opacity-30">MTRS</span>
                  </div>
                </div>
                <div className="group space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors ml-1 flex items-center gap-1">
                    Alert Level
                    <AlertTriangle className="w-3 h-3 text-amber-500 opacity-60" />
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="h-10 rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photo Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-primary/50" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Digital Metadata</h4>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 flex items-center justify-center gap-4 transition-all cursor-pointer group ${formData.imageUrl ? 'border-primary/20 bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-slate-50/50'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
              
              {isUploading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading...</span>
                </div>
              ) : formData.imageUrl ? (
                <div className="flex items-center gap-4 w-full justify-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md relative group-hover:scale-105 transition-transform">
                    <img src={formData.imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="text-white w-5 h-5" onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, imageUrl: '' });
                      }} />
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Image Saved</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-foreground block">Capture Product Essence</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Tap to upload high-res image</span>
                  </div>
                </div>
              )}
            </div>
            {/* Mobile Camera Option */}
            {adminUserId && deviceStatus !== 'unpaired' && (
              <div className="flex items-center gap-3 px-1">
                <MobileCameraButton
                  context="product"
                  label="Take Product Photo"
                  onPhotoReady={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                  adminUserId={adminUserId}
                  variant="outline"
                  size="sm"
                />
                <span className="text-[10px] text-muted-foreground">or upload from device above</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-border/50 gap-3 flex-col sm:flex-row">
            <div className="flex-1 hidden sm:block">
              <div className="flex items-center gap-2 text-muted-foreground opacity-30 mt-3">
                <Info className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">All fields mandatory</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border-2"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20 bg-primary text-[13px] tracking-tight hover:scale-[1.02] active:scale-95 transition-all text-white"
            >
              {isLoading ? t('common.loading') : (
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Commit Product
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
