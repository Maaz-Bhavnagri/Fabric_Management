'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useInventoryData } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import InventoryTable from '@/components/inventory/InventoryTable';
import AddFabricModal from '@/components/inventory/AddFabricModal';
import EditFabricModal from '@/components/inventory/EditFabricModal';
import { 
  Search, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  Table as TableIcon,
  AlertCircle,
  Package
} from 'lucide-react';
import { filterRank } from '@/lib/fuzzy-search';
import { sortByKey, type SortDir } from '@/lib/sort-utils';
import type { InventoryRow } from '@/lib/app-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function InventoryPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { fabrics, loading, error, addFabric, deleteFabric, updateFabric } =
    useInventoryData(searchTerm);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const sortKeys = ['designName', 'stockMeters', 'sellingPricePerMeter'] as const;
  type SortKey = (typeof sortKeys)[number];
  const [sortKey, setSortKey] = useState<SortKey>('designName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const visibleFabrics = useMemo(() => {
    const searched = filterRank(fabrics, searchTerm);
    const filtered = lowStockOnly
      ? searched.filter((f) => f.stockMeters < (f.lowStockThreshold ?? 10))
      : searched;
    return sortByKey(filtered, sortKey, sortDir);
  }, [fabrics, searchTerm, lowStockOnly, sortKey, sortDir]);

  if (loading && !fabrics.length) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage your fabric stock and design catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1">
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="w-8 h-8 rounded-lg"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="w-8 h-8 rounded-lg"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6"
          >
            <Plus className="w-4 h-4" />
            {t('inventory.addFabric')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-none shadow-md shadow-black/5 p-4 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('inventory.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all ring-offset-background"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant={lowStockOnly ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`rounded-xl h-11 gap-2 ${lowStockOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}`}
            >
              <AlertCircle className={`w-4 h-4 ${lowStockOnly ? 'text-amber-500' : 'text-muted-foreground'}`} />
              Low Stock Only
            </Button>

            <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-slate-50/50">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 w-[120px] h-full shadow-none p-0">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent rounded-xl>
                  <SelectItem value="designName">Name</SelectItem>
                  <SelectItem value="stockMeters">Stock</SelectItem>
                  <SelectItem value="sellingPricePerMeter">Price</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 w-[80px] h-full shadow-none p-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent rounded-xl>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Content Area */}
      {visibleFabrics.length === 0 ? (
        <Card className="bg-card border-none shadow-md shadow-black/5 p-20 rounded-2xl text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No fabrics found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mb-8">
            {searchTerm ? "Try adjusting your search terms or filters." : "Start by adding your first fabric to the inventory."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddModal(true)} className="rounded-xl h-11 px-8">
              Add Fabric
            </Button>
          )}
        </Card>
      ) : (
        <InventoryTable
          fabrics={visibleFabrics}
          onDelete={deleteFabric}
          onEdit={(f) => setEditing(f)}
          viewMode={viewMode}
        />
      )}

      {showAddModal && (
        <AddFabricModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (fabric) => {
            await addFabric(fabric);
            setShowAddModal(false);
          }}
        />
      )}

      {editing && (
        <EditFabricModal
          fabric={editing}
          onClose={() => setEditing(null)}
          onSave={async (updates) => {
            await updateFabric(editing.id, updates);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
