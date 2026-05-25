'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { useSuppliersData } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import SuppliersTable from '@/components/suppliers/SuppliersTable';
import AddSupplierModal from '@/components/suppliers/AddSupplierModal';
import EditSupplierModal from '@/components/suppliers/EditSupplierModal';
import { Search, Plus, Truck, Filter, ArrowUpDown } from 'lucide-react';
import { filterRank } from '@/lib/fuzzy-search';
import { sortByKey, type SortDir } from '@/lib/sort-utils';
import type { SupplierRow } from '@/lib/app-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SuppliersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { suppliers, loading, addSupplier, updateSupplier } = useSuppliersData(searchTerm);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const sortKeys = ['name', 'city', 'createdAt'] as const;
  type SortKey = (typeof sortKeys)[number];
  const isSortKey = (v: string): v is SortKey =>
    (sortKeys as readonly string[]).includes(v);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  
  const visibleSuppliers = useMemo(
    () => sortByKey(filterRank(suppliers, searchTerm), sortKey, sortDir),
    [suppliers, searchTerm, sortKey, sortDir]
  );

  if (loading && !suppliers.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Spinner className="w-10 h-10 text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Suppliers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">
              {t('suppliers.title')}
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Manage your textile sources</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="h-14 px-8 rounded-2xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-black shadow-2xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          {t('suppliers.addSupplier')}
        </Button>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="flex flex-col xl:flex-row gap-6 mb-10 items-start xl:items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors opacity-40" />
            <Input
              placeholder={t('suppliers.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 pr-12 rounded-2xl border-none bg-slate-100/50 dark:bg-slate-800/50 text-base font-bold placeholder:font-medium focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl">
              <Filter className="w-4 h-4 text-muted-foreground opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pr-2 italic">Sort by</span>
              <Select value={sortKey} onValueChange={(v) => isSortKey(v) && setSortKey(v)}>
                <SelectTrigger className="h-10 w-[120px] bg-white dark:bg-slate-900 border-none rounded-xl font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent rounded-xl>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
              <SelectTrigger className="h-10 w-[100px] bg-white dark:bg-slate-900 border-none rounded-xl font-bold shadow-sm">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent rounded-xl>
                <SelectItem value="asc">Asc</SelectItem>
                <SelectItem value="desc">Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border/50 bg-white/40 dark:bg-slate-900/40 overflow-hidden shadow-sm">
          <SuppliersTable suppliers={visibleSuppliers} onEdit={(s) => setEditing(s)} />
        </div>
      </Card>

      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (supplier) => {
          await addSupplier(supplier);
          toast({
            title: 'Supplier Added Successfully',
            description: `${supplier.name} has been onboarded successfully.`,
          });
          setShowAddModal(false);
        }}
      />

      {editing && (
        <EditSupplierModal
          supplier={editing}
          onClose={() => setEditing(null)}
          onSave={async (updates) => {
            await updateSupplier(editing.id, updates);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
