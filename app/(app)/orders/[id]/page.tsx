'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Clock, Calendar, CheckCircle2, AlertCircle, Phone, MapPin, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WorkflowTracker } from '@/components/sales/WorkflowTracker';
import { format } from 'date-fns';
import { use } from 'react';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch order');
        setOrder(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading Order Details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-bold text-foreground">Order Not Found</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.href = '/orders'} variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  // Derive allAssignments for WorkflowTracker
  const allAssignments = order.items?.flatMap((i: any) => i.stitchAssignments || []) || [];

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── 1. Top Navigation & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => window.location.href = '/orders'} 
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Orders
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Invoice #{order.invoiceNumber}</h1>
            {order.isDraft && <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase">DRAFT</Badge>}
            {order.priority && order.priority !== 'Normal' && (
              <Badge variant="outline" className={cn("px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-widest border", order.priority === 'Urgent' ? 'text-red-600 border-red-600 bg-red-50' : 'text-amber-600 border-amber-600 bg-amber-50')}>
                {order.priority}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── LEFT COLUMN (Main Details) ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Timeline & Workflow */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Timeline & Workflow
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Ordered On</p>
                  <p className="text-sm font-black text-foreground">{format(new Date(order.createdAt), 'PPpp')}</p>
                </div>
                <div className={cn("rounded-2xl p-4 border", order.expectedDeliveryDate ? "bg-primary/5 border-primary/20" : "bg-slate-50 dark:bg-slate-800/50 border-border/50")}>
                  <p className={cn("text-[10px] uppercase font-bold mb-1 tracking-widest", order.expectedDeliveryDate ? "text-primary" : "text-muted-foreground")}>Expected Delivery</p>
                  {order.expectedDeliveryDate ? (
                    <p className="text-lg font-black text-primary">{format(new Date(order.expectedDeliveryDate), 'PP')}</p>
                  ) : (
                    <p className="text-sm font-black text-muted-foreground/60">Not Scheduled</p>
                  )}
                </div>
              </div>

              {allAssignments.length > 0 ? (
                <div className="pt-2">
                  <WorkflowTracker 
                    invoiceId={order.id}
                    stitchAssignments={allAssignments}
                    paymentStatus={order.paymentStatus}
                    dueAmount={order.dueAmount || 0}
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-sm font-medium text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
                  No tailoring items in this order.
                </div>
              )}
            </div>
          </div>

          {/* Products & Fabrics */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Products & Tailoring
              </h2>
            </div>
            <div className="p-0">
              <div className="divide-y divide-border/50">
                {order.items?.map((item: any, idx: number) => {
                  return (
                    <div key={item.id} className="p-5 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex flex-col sm:flex-row gap-5">
                        
                        {/* Fabric Preview */}
                        <div className="w-full sm:w-24 shrink-0">
                          <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border border-border/50 overflow-hidden relative">
                            {item.fabricVariant?.imageUrl || item.fabricVariant?.design?.defaultImageUrl ? (
                              <img 
                                src={item.fabricVariant.imageUrl || item.fabricVariant.design?.defaultImageUrl} 
                                alt={item.fabricVariant.design?.designName || 'Product'} 
                                className="object-cover w-full h-full" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                                <Search className="w-6 h-6 mb-1" />
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-center">
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                              {item.fabricVariant?.color || 'Unknown'}
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-lg font-black text-foreground">
                                {item.fabricVariant?.design?.designName || 'Custom Product'}
                                {item.fabricVariant?.variantName ? ` - ${item.fabricVariant.variantName}` : ''}
                              </h3>
                              <p className="text-xs font-bold text-muted-foreground mt-0.5">
                                {item.meters}m × ₹{item.ratePerMeter.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-foreground">₹{item.lineTotal.toLocaleString()}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Line Total</p>
                            </div>
                          </div>

                          {/* Tailoring Details */}
                          {item.stitchAssignments && item.stitchAssignments.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tailoring Included</p>
                                {item.stitchingPrice > 0 && (
                                  <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">+₹{item.stitchingPrice.toLocaleString()}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                {item.stitchAssignments.map((st: any, i: number) => (
                                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-white dark:bg-slate-900 font-bold uppercase border-indigo-200 text-indigo-700 dark:border-indigo-900 dark:text-indigo-400">
                                        {st.stitchTypeName}
                                      </Badge>
                                      {st.tailors && st.tailors.length > 0 && (
                                        <span className="text-muted-foreground font-medium">
                                          assigned to <span className="font-bold text-foreground">{st.tailors[0].tailorName}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (Sidebar Details) ── */}
        <div className="space-y-6">
          
          {/* Customer Details */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-3xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Phone className="w-24 h-24" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Customer Details</h2>
            <div className="relative z-10">
              <p className="text-xl font-black text-foreground mb-1">{order.customer?.fullName || 'Walk-in Customer'}</p>
              {order.customer?.phone && (
                <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline w-max mb-3">
                  <Phone className="w-3.5 h-3.5" /> {order.customer.phone}
                </a>
              )}
              {order.customer?.address && (
                <p className="flex items-start gap-2 text-xs font-medium text-muted-foreground mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-border/50">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {order.customer.address} {order.customer.city ? `, ${order.customer.city}` : ''}
                </p>
              )}
            </div>
            
            {order.customer?.measurements && order.customer.measurements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/50 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Measurements</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {Object.entries(order.customer.measurements[0])
                    .filter(([key, val]) => ['chest', 'waist', 'shoulder', 'sleeve', 'neck', 'hip', 'inseam', 'length'].includes(key) && val)
                    .map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-border/30 pb-1">
                      <span className="text-muted-foreground capitalize">{key}</span>
                      <span className="font-bold text-foreground">{val as string}</span>
                    </div>
                  ))}
                </div>
                {order.customer.measurements[0].custom_notes && (
                  <p className="mt-3 text-xs text-muted-foreground italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    "{order.customer.measurements[0].custom_notes}"
                  </p>
                )}
                {order.customer.measurements[0].photo_url && (
                  <div className="mt-3">
                    <img 
                      src={order.customer.measurements[0].photo_url} 
                      alt="Reference" 
                      className="w-full h-auto rounded-xl border border-border/50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Billing Summary */}
          <div className="bg-slate-950 dark:bg-slate-900 rounded-3xl shadow-lg p-6 text-slate-100 border border-slate-800">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Billing Summary</h2>
            
            <div className="space-y-3 mb-6 border-b border-slate-800 pb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Fabric Subtotal</span>
                <span className="font-bold">₹{order.totalFabricAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Stitching Subtotal</span>
                <span className="font-bold">₹{order.totalStitchingAmount?.toLocaleString()}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Tax</span>
                  <span className="font-bold">₹{order.tax?.toLocaleString()}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span className="font-bold">Discount</span>
                  <span className="font-bold">-₹{order.discount?.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Grand Total</p>
                <p className="text-3xl font-black text-white">₹{order.grandTotal?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <Badge className={cn("uppercase font-black tracking-widest text-[9px]", order.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30')}>
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Advance Paid</p>
                <p className="text-lg font-black text-emerald-400">₹{order.advancePaid?.toLocaleString()}</p>
              </div>
              <div className={cn("p-3 rounded-xl border", order.dueAmount > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-900/50 dark:bg-slate-950/50 border-slate-800")}>
                <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", order.dueAmount > 0 ? "text-amber-500" : "text-slate-500")}>Balance Due</p>
                <p className={cn("text-lg font-black", order.dueAmount > 0 ? "text-amber-400" : "text-slate-400")}>₹{order.dueAmount?.toLocaleString()}</p>
              </div>
            </div>

          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-500/70 mb-2">Order Notes</h2>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
