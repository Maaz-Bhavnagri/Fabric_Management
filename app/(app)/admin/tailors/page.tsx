'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit2, ShieldAlert, Scissors, Check, Trash2, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Tailor = {
  id: string;
  full_name: string;
  phone: string;
  address: string | null;
  specialization: string | null;
  notes: string | null;
  is_active: boolean;
};

type StitchType = {
  id: string;
  name: string;
};

type TailorPrice = {
  id: string;
  stitch_type_id: string;
  price: number;
};

export default function TailorsPage() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [stitchTypes, setStitchTypes] = useState<StitchType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'prices' | null>(null);
  const [selectedTailor, setSelectedTailor] = useState<Tailor | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Prices State
  const [tailorPrices, setTailorPrices] = useState<Record<string, number | string>>({});

  useEffect(() => {
    fetchTailors();
    fetchStitchTypes();
  }, []);

  const fetchTailors = async () => {
    try {
      const res = await fetch('/api/tailors');
      const data = await res.json();
      if (data.success) {
        setTailors(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStitchTypes = async () => {
    try {
      const res = await fetch('/api/stitch-types');
      const data = await res.json();
      if (data.success) setStitchTypes(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTailorPrices = async (tailorId: string) => {
    try {
      const res = await fetch(`/api/tailors/prices?tailorId=${tailorId}`);
      const data = await res.json();
      if (data.success) {
        const pricesMap: Record<string, number | string> = {};
        data.data.forEach((p: TailorPrice) => {
          pricesMap[p.stitch_type_id] = p.price;
        });
        setTailorPrices(pricesMap);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setFullName('');
    setPhone('');
    setAddress('');
    setSpecialization('');
    setNotes('');
    setIsActive(true);
    setModalMode('add');
  };

  const handleOpenEdit = (t: Tailor) => {
    setSelectedTailor(t);
    setFullName(t.full_name);
    setPhone(t.phone);
    setAddress(t.address || '');
    setSpecialization(t.specialization || '');
    setNotes(t.notes || '');
    setIsActive(t.is_active);
    setModalMode('edit');
  };

  const handleOpenPrices = async (t: Tailor) => {
    setSelectedTailor(t);
    setTailorPrices({});
    await fetchTailorPrices(t.id);
    setModalMode('prices');
  };

  const handleSaveTailor = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast({ title: 'Error', description: 'Name and phone are required', variant: 'destructive' });
      return;
    }

    try {
      const url = modalMode === 'edit' && selectedTailor ? `/api/tailors?id=${selectedTailor.id}` : '/api/tailors';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, address, specialization, notes, isActive })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: `Tailor ${modalMode === 'edit' ? 'updated' : 'added'}` });
        setModalMode(null);
        fetchTailors();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleSavePrices = async () => {
    if (!selectedTailor) return;
    try {
      const pricesPayload = Object.entries(tailorPrices).map(([stitchTypeId, price]) => ({
        stitchTypeId,
        price: Number(price) || 0
      }));

      const res = await fetch('/api/tailors/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailorId: selectedTailor.id, prices: pricesPayload })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Prices updated' });
        setModalMode(null);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save prices', variant: 'destructive' });
    }
  };

  const filteredTailors = tailors.filter(t => t.full_name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search));

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tailor Management</h1>
          <p className="text-muted-foreground mt-1">Manage tailors, contact info, and their stitching prices.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Add Tailor
        </Button>
      </div>

      <Card className="p-4 flex items-center gap-2 shadow-sm rounded-2xl border-none">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search tailors by name or phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 text-base"
        />
      </Card>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTailors.map(tailor => (
            <Card key={tailor.id} className="p-5 flex flex-col gap-4 shadow-sm border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{tailor.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{tailor.phone}</p>
                  </div>
                </div>
                {!tailor.is_active && (
                  <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Inactive</span>
                )}
              </div>
              
              <div className="flex-1">
                {tailor.specialization && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    <span className="font-medium">Specialization:</span> {tailor.specialization}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={() => handleOpenPrices(tailor)} className="flex-1 gap-1.5 h-9 rounded-lg">
                  <Tag className="w-3.5 h-3.5" /> Set Prices
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tailor)} className="h-9 w-9 p-0 rounded-lg shrink-0">
                  <Edit2 className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
            </Card>
          ))}
          {filteredTailors.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No tailors found.</p>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <Dialog open={modalMode === 'add' || modalMode === 'edit'} onOpenChange={(v) => !v && setModalMode(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{modalMode === 'edit' ? 'Edit Tailor' : 'Add Tailor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Full Name</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Ramesh" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Phone Number</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Address (Optional)</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Specialization (Optional)</label>
              <Input value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="e.g. Shirts, Pants" className="rounded-xl" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
              <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer">Active Tailor</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setModalMode(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveTailor} className="rounded-xl">Save Tailor</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SET PRICES MODAL */}
      <Dialog open={modalMode === 'prices'} onOpenChange={(v) => !v && setModalMode(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0 pb-4 border-b">
            <DialogTitle>Set Prices for {selectedTailor?.full_name}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
            {stitchTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No stitch types found. Please add stitch types first.</p>
            ) : (
              stitchTypes.map(st => (
                <div key={st.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <span className="font-semibold text-sm">{st.name}</span>
                  <div className="flex items-center gap-2 w-32">
                    <span className="text-muted-foreground font-medium text-sm">₹</span>
                    <Input 
                      type="number" 
                      min="0"
                      className="h-9 rounded-lg text-right font-semibold"
                      value={tailorPrices[st.id] === undefined ? '' : tailorPrices[st.id]}
                      onChange={(e) => setTailorPrices(prev => ({ ...prev, [st.id]: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="shrink-0 pt-4 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalMode(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSavePrices} className="rounded-xl">Save Prices</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
