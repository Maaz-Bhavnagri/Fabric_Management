'use client';

import { useLanguage } from '@/context/LanguageContext';
import type { CustomerRow } from '@/lib/app-types';
import { Pencil, MoreVertical, Mail, Phone, MapPin, Calendar, IndianRupee, Ruler, Camera, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import PhotoViewer from '@/components/common/PhotoViewer';
import { useState } from 'react';

interface CustomersTableProps {
  customers: CustomerRow[];
  onEdit?: (customer: CustomerRow) => void;
}

export default function CustomersTable({ customers, onEdit }: CustomersTableProps) {
  const { t } = useLanguage();
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; name: string } | null>(null);

  const hasMeasurements = (m: CustomerRow['measurement']) => {
    if (!m) return false;
    return [m.chest, m.waist, m.shoulder, m.sleeve, m.neck, m.hip, m.inseam, m.length].some(
      (v) => v !== null && v !== undefined
    );
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border mt-6">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-medium">{t('customers.noCustomers')}</p>
      </div>
    );
  }

  const FIELDS: Array<{ key: keyof NonNullable<CustomerRow['measurement']>; label: string }> = [
    { key: 'chest', label: 'Ch' },
    { key: 'waist', label: 'Wa' },
    { key: 'shoulder', label: 'Sh' },
    { key: 'sleeve', label: 'Sl' },
    { key: 'neck', label: 'Nk' },
    { key: 'hip', label: 'Hi' },
    { key: 'length', label: 'Ln' },
    { key: 'inseam', label: 'In' },
  ];

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm mt-6">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border">
              <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                {t('customers.name')}
              </th>
              <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                Contact Info
              </th>
              <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                {t('customers.city')}
              </th>
              <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                Measurements
              </th>
              <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                Value
              </th>
              <th className="text-left py-4 px-6 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                Registered
              </th>
              <th className="py-4 px-6 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="group hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors"
              >
                {/* Name */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {customer.fullName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{customer.fullName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Active Customer</span>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{customer.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
                      <Phone className="w-3 h-3 text-primary/70" />
                      <span className="text-foreground/80">{customer.phone}</span>
                    </div>
                  </div>
                </td>

                {/* City */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{customer.city || '—'}</span>
                  </div>
                </td>

                {/* Measurements */}
                <td className="py-4 px-6">
                  {customer.measurement?.photoUrl ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingPhoto({ src: customer.measurement!.photoUrl!, name: customer.fullName })}
                        className="relative group/photo w-10 h-10 rounded-xl overflow-hidden border border-border flex-shrink-0 shadow-sm hover:shadow-md transition-shadow"
                        title="View measurement photo"
                      >
                        <img
                          src={customer.measurement.photoUrl}
                          alt="Measurement photo"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/30 flex items-center justify-center transition-all">
                          <ZoomIn className="w-3 h-3 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      {hasMeasurements(customer.measurement) && (
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {FIELDS.filter(f => customer.measurement![f.key] != null).slice(0, 4).map(f => (
                            <span key={f.key} className="text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 px-1.5 py-0.5 rounded-md">
                              {f.label}: {customer.measurement![f.key]}"
                            </span>
                          ))}
                          {FIELDS.filter(f => customer.measurement![f.key] != null).length > 4 && (
                            <span className="text-[9px] font-black text-muted-foreground">
                              +{FIELDS.filter(f => customer.measurement![f.key] != null).length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : hasMeasurements(customer.measurement) ? (
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {FIELDS.filter(f => customer.measurement![f.key] != null).slice(0, 3).map(f => (
                          <span key={f.key} className="text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 px-1.5 py-0.5 rounded-md">
                            {f.label}: {customer.measurement![f.key]}"
                          </span>
                        ))}
                        {FIELDS.filter(f => customer.measurement![f.key] != null).length > 3 && (
                          <span className="text-[9px] font-black text-muted-foreground">
                            +{FIELDS.filter(f => customer.measurement![f.key] != null).length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground opacity-40">—</span>
                  )}
                </td>

                {/* Value */}
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary">₹{(customer.lifetimeValue || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Lifetime Value</span>
                  </div>
                </td>

                {/* Date */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => onEdit?.(customer)} className="gap-2 focus:bg-primary/5 focus:text-primary">
                        <Pencil className="w-4 h-4" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 focus:bg-primary/5 focus:text-primary">
                        <IndianRupee className="w-4 h-4" /> View Transactions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingPhoto && (
        <PhotoViewer
          src={viewingPhoto.src}
          alt={`${viewingPhoto.name} - Measurement Photo`}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </>
  );
}
