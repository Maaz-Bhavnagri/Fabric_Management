'use client';

import { useLanguage } from '@/context/LanguageContext';
import type { SupplierRow } from '@/lib/app-types';
import { Pencil, Building2, Mail, Phone, MapPin, Hash, MoreVertical, ExternalLink, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SuppliersTableProps {
  suppliers: SupplierRow[];
  onEdit?: (supplier: SupplierRow) => void;
}

export default function SuppliersTable({ suppliers, onEdit }: SuppliersTableProps) {
  const { t } = useLanguage();

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-32 bg-white/40 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-border/60 mt-6 backdrop-blur-sm">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Building2 className="w-10 h-10 text-primary opacity-20" />
        </div>
        <h3 className="text-lg font-black italic tracking-tight">{t('suppliers.noSuppliers')}</h3>
        <p className="text-muted-foreground text-sm font-medium opacity-60">Start by adding your first production partner</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-6 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50 italic">
                {t('suppliers.name')}
              </th>
              <th className="text-left py-6 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50 italic">
                Contact Identity
              </th>
              <th className="text-left py-6 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50 italic">
                Logistics Center
              </th>
              <th className="text-left py-6 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50 italic">
                Tax ID
              </th>
              <th className="py-6 px-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300"
              >
                <td className="py-6 px-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-base shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {supplier.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm border border-border">
                        <BadgeCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-black text-foreground tracking-tight italic group-hover:text-primary transition-colors">
                        {supplier.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 rounded uppercase tracking-tighter">Gold Partner</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                      <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                        <Mail className="w-3 h-3 opacity-40" />
                      </div>
                      <span>{supplier.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-primary italic">
                      <div className="p-1 rounded bg-primary/5">
                        <Phone className="w-3 h-3" />
                      </div>
                      <span>{supplier.phone || '—'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/50 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-muted-foreground opacity-40" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-foreground/80 italic">{supplier.city}</span>
                      <span className="text-[10px] font-medium text-muted-foreground opacity-50 truncate max-w-[150px]">Main Distribution</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-border/30">
                    <Hash className="w-3 h-3 text-muted-foreground opacity-30" />
                    <span className="text-[10px] font-black font-mono tracking-wider text-muted-foreground">
                      {supplier.gstin || 'UNREGISTERED'}
                    </span>
                  </div>
                </td>
                <td className="py-6 px-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                        <MoreVertical className="w-5 h-5 text-muted-foreground opacity-40 group-hover:opacity-100" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                      <DropdownMenuItem 
                        onClick={() => onEdit?.(supplier)} 
                        className="h-10 px-4 rounded-xl gap-3 font-black text-[11px] uppercase tracking-widest focus:bg-primary focus:text-white cursor-pointer transition-all"
                      >
                        <Pencil className="w-4 h-4" /> Edit Profile
                      </DropdownMenuItem>
                      <div className="my-1 h-px bg-border/40" />
                      <DropdownMenuItem className="h-10 px-4 rounded-xl gap-3 font-black text-[11px] uppercase tracking-widest focus:bg-primary focus:text-white cursor-pointer transition-all">
                        <ExternalLink className="w-4 h-4" /> Supplier Portal
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
  );
}
