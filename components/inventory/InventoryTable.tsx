'use client';

import { useLanguage } from '@/context/LanguageContext';
import type { InventoryRow } from '@/lib/app-types';
import { Pencil, Trash2, MoreVertical, Image as ImageIcon, AlertTriangle, CheckCircle2, Box, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import PhotoViewer from '@/components/common/PhotoViewer';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';

interface InventoryTableProps {
  fabrics: InventoryRow[];
  onDelete: (id: string) => Promise<void>;
  onEdit?: (fabric: InventoryRow) => void;
  viewMode?: 'table' | 'grid';
}

export default function InventoryTable({
  fabrics,
  onDelete,
  onEdit,
  viewMode = 'table',
}: InventoryTableProps) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; alt: string } | null>(null);

  const getStockStatus = (stockMeters: number, threshold: number = 10) => {
    if (stockMeters === 0) return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
    if (stockMeters < threshold) return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
  };

  const getStockLabel = (stockMeters: number, threshold: number = 10) => {
    if (stockMeters === 0) return t('inventory.outOfStock');
    if (stockMeters < threshold) return t('inventory.lowStock');
    return t('inventory.inStock');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fabrics.map((fabric) => (
            <Card key={fabric.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-card">
              <div className="aspect-[4/3] bg-muted relative overflow-hidden group">
                {fabric.imageUrl ? (
                  <button
                    onClick={() => setViewingPhoto({ src: fabric.imageUrl!, alt: fabric.designName })}
                    className="w-full h-full group/zoom relative"
                  >
                    <img src={fabric.imageUrl} alt={fabric.designName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover/zoom:bg-black/20 flex items-center justify-center transition-all">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/zoom:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
                <div className="absolute top-4 right-4 z-20">
                  <Badge variant="outline" className={`backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border shadow-sm ${getStockStatus(fabric.stockMeters, fabric.lowStockThreshold)}`}>
                    {getStockLabel(fabric.stockMeters, fabric.lowStockThreshold)}
                  </Badge>
                </div>
                <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                   <div className="flex gap-2">
                     <Button size="icon" variant="secondary" className="rounded-xl glass shadow-lg" onClick={() => onEdit?.(fabric)}>
                        <Pencil className="w-4 h-4" />
                     </Button>
                     <Button size="icon" variant="destructive" className="rounded-xl shadow-lg" onClick={() => setDeleteId(fabric.id)}>
                        <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-foreground text-lg leading-tight line-clamp-1">{fabric.designName}</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60 mt-1">{fabric.category} • {fabric.color}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block opacity-40">Retail Price</span>
                    <span className="text-md font-black text-primary">₹{fabric.sellingPricePerMeter}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block opacity-40">In Stock</span>
                    <span className="text-md font-black text-foreground">{fabric.stockMeters}m</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <ConfirmDeleteDialog 
          isOpen={!!deleteId} 
          onOpenChange={(open) => !open && setDeleteId(null)} 
          onConfirm={handleDelete}
          description="Are you sure you want to delete this fabric from inventory?"
        />
      </>
    );
  }

  return (
    <>
      {/* 📱 Mobile Card View (shown when in table mode on mobile) */}
      <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
        {fabrics.map((fabric) => (
          <Card key={fabric.id} className="group overflow-hidden border border-border/50 shadow-sm rounded-2xl bg-card">
            <div className="flex p-4 gap-4">
              <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden relative shrink-0">
                {fabric.imageUrl ? (
                  <button onClick={() => setViewingPhoto({ src: fabric.imageUrl!, alt: fabric.designName })} className="w-full h-full">
                    <img src={fabric.imageUrl} alt={fabric.designName} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{fabric.designName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="px-1.5 py-0 text-[8px] uppercase tracking-wider">{fabric.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{fabric.color}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary">₹{fabric.sellingPricePerMeter}</span>
                    <span className="text-[9px] text-muted-foreground">/meter</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-foreground">{fabric.stockMeters}m</span>
                    <span className="text-[9px] text-muted-foreground">Stock</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 border-t border-border/50">
              <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight shadow-sm ${getStockStatus(fabric.stockMeters, fabric.lowStockThreshold)}`}>
                {getStockLabel(fabric.stockMeters, fabric.lowStockThreshold)}
              </Badge>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => onEdit?.(fabric)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-36">
                    <DropdownMenuItem onClick={() => setDeleteId(fabric.id)} className="text-red-500 font-medium text-xs">
                      <Trash2 className="w-3 h-3 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 💻 Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-[2rem] border border-border/60 shadow-sm bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/50">
              <th className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] w-24 text-center">Snapshot</th>
              <th className="py-5 px-8 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Product Details</th>
              <th className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Procurement</th>
              <th className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Selling Price</th>
              <th className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Inventory</th>
              <th className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="py-5 px-6 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {fabrics.map((fabric) => (
              <tr key={fabric.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-all duration-200">
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner border border-border/50 group-hover:scale-105 transition-transform">
                      {fabric.imageUrl ? (
                        <button
                          onClick={() => setViewingPhoto({ src: fabric.imageUrl!, alt: fabric.designName })}
                          className="w-full h-full relative group/zoom"
                        >
                          <img src={fabric.imageUrl} alt={fabric.designName} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover/zoom:bg-black/30 flex items-center justify-center transition-all">
                            <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/zoom:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <ImageIcon className="w-6 h-6 text-muted-foreground opacity-20" />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-foreground tracking-tight">{fabric.designName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="px-2 py-0 text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 border-none opacity-60">
                        {fabric.category}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-40">{fabric.color}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground opacity-60">₹{fabric.purchasePricePerMeter}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mt-0.5">Cost Price</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary">₹{fabric.sellingPricePerMeter}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 mt-0.5">Retail Price</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground shadow-inner">
                      <Box className="w-5 h-5 opacity-40" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-foreground">{fabric.stockMeters}m</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mt-0.5">Current Stock</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${getStockStatus(
                      fabric.stockMeters,
                      fabric.lowStockThreshold
                    )}`}
                  >
                    {getStockLabel(fabric.stockMeters, fabric.lowStockThreshold)}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl w-48 shadow-2xl border-border/50 p-2">
                      <DropdownMenuItem onClick={() => onEdit?.(fabric)} className="gap-3 py-3 px-4 rounded-xl font-bold focus:bg-indigo-50 dark:focus:bg-indigo-950/30 focus:text-indigo-600 transition-all cursor-pointer">
                        <Pencil className="w-4 h-4" /> Edit Parameters
                      </DropdownMenuItem>
                      <div className="h-px bg-border/50 my-2" />
                      <DropdownMenuItem onClick={() => setDeleteId(fabric.id)} className="gap-3 py-3 px-4 rounded-xl font-bold text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-500 transition-all cursor-pointer">
                        <Trash2 className="w-4 h-4" /> Purge Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      <ConfirmDeleteDialog 
        isOpen={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        onConfirm={handleDelete}
        description="This action will permanently archive the fabric record and clear its stock metrics."
      />
      {viewingPhoto && (
        <PhotoViewer
          src={viewingPhoto.src}
          alt={viewingPhoto.alt}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </>
  );
}
