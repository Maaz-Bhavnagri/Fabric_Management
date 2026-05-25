'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCustomersData } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import CustomersTable from '@/components/customers/CustomersTable';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import { 
  Search, 
  Users, 
  ArrowUpDown, 
  UserPlus, 
  AlertCircle
} from 'lucide-react';
import { filterRank } from '@/lib/fuzzy-search';
import { sortByKey, type SortDir } from '@/lib/sort-utils';
import type { CustomerRow } from '@/lib/app-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomersPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { customers, loading, updateCustomer, addCustomer } = useCustomersData(searchTerm);
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  const sortKeys = ['fullName', 'lifetimeValue', 'createdAt'] as const;
  type SortKey = (typeof sortKeys)[number];
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const visibleCustomers = useMemo(
    () => sortByKey(filterRank(customers, searchTerm), sortKey, sortDir),
    [customers, searchTerm, sortKey, sortDir]
  );

  if (loading && !customers.length) {
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
            {t('customers.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Maintain relationship and track purchase history of your customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6"
          >
            <UserPlus className="w-4 h-4" />
            {t('customers.addCustomer')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-none shadow-md shadow-black/5 p-4 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('customers.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-12 rounded-xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-slate-50/50">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 w-[140px] h-full shadow-none p-0 text-xs font-bold uppercase tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent rounded-xl>
                  <SelectItem value="fullName">Customer Name</SelectItem>
                  <SelectItem value="lifetimeValue">Lifetime Value</SelectItem>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-border mx-1" />
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 w-[60px] h-full shadow-none p-0 text-xs font-bold uppercase tracking-tight">
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

      {/* Content Area */}
      {visibleCustomers.length === 0 ? (
        <Card className="bg-card border-none shadow-md shadow-black/5 p-20 rounded-2xl text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No customers found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {searchTerm ? "No customers match your search criteria." : "You haven't added any customers yet. New customers are automatically created when you record an order."}
          </p>
        </Card>
      ) : (
        <CustomersTable customers={visibleCustomers} onEdit={(c) => setEditing(c)} />
      )}

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (customer) => {
            await addCustomer(customer);
            setShowAddModal(false);
          }}
        />
      )}

      {editing && (
        <EditCustomerModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSave={async (updates) => {
            await updateCustomer(editing.id, updates);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
