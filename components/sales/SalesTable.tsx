'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { InvoiceRow, InvoiceDetail } from '@/lib/app-types';
import { generateOrderPdf } from '@/lib/pdf-utils';
import { 
  MoreVertical, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  User, 
  Calendar, 
  IndianRupee,
  Loader2,
  Package,
  Phone,
  CreditCard,
  MapPin,
  AlertCircle,
  FileEdit,
  Eye
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import OrderDetailsModal from './OrderDetailsModal';
import { WorkflowTracker } from './WorkflowTracker';

interface SalesTableProps {
  orders: InvoiceRow[];
  onUpdateStatus?: (id: string, status: string) => Promise<any>;
  onDeleteOrder?: (id: string) => Promise<void>;
  onGetOrderDetails?: (id: string) => Promise<InvoiceDetail>;
  onEditOrder?: (id: string) => void;
}

export default function SalesTable({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onGetOrderDetails,
  onEditOrder
}: SalesTableProps) {
  const { t } = useLanguage();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<InvoiceDetail | null>(null);

  const handleDownload = async (order: InvoiceRow) => {
    if (!onGetOrderDetails) return;
    try {
      setDownloadingId(order.id);
      const fullOrder = await onGetOrderDetails(order.id);
      await generateOrderPdf(fullOrder);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (deleteId && onDeleteOrder) {
      await onDeleteOrder(deleteId);
      setDeleteId(null);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    if (!onGetOrderDetails) return;
    
    try {
      setDetailsOrderId(orderId);
      const details = await onGetOrderDetails(orderId);
      setOrderDetails(details);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      setDetailsOrderId(null);
      setOrderDetails(null);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOrderId(null);
    setOrderDetails(null);
  };

  const handleUpdateOrder = async (id: string, updates: any) => {
    if (!onUpdateStatus) return;
    
    // For now, we only support updating payment status
    if (updates.paymentStatus) {
      await onUpdateStatus(id, updates.paymentStatus);
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'cash':
        return <IndianRupee className="w-3 h-3" />;
      case 'upi':
        return <CreditCard className="w-3 h-3" />;
      case 'card':
        return <CreditCard className="w-3 h-3" />;
      case 'mixed':
        return <CreditCard className="w-3 h-3" />;
      default:
        return <IndianRupee className="w-3 h-3" />;
    }
  };

  const getPaymentMethodColor = (method?: string) => {
    switch (method) {
      case 'cash':
        return 'text-green-600 bg-green-50 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50';
      case 'upi':
        return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
      case 'card':
        return 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50';
      case 'mixed':
        return 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const isOverdue = (date?: string | null, status?: string) => {
    if (!date) return false;
    const isPending = !orderHasDeliveredStatus(status); // We'll simplify this to check if payment/delivery is pending
    if (!isPending) return false;
    const due = new Date(date);
    due.setHours(23, 59, 59, 999);
    return new Date() > due;
  };

  const orderHasDeliveredStatus = (status?: string) => false; // Just a stub, we will check actual items later.

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900';
      case 'Low': return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800';
      default: return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border mt-6">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-medium">{t('sales.noOrders')}</p>
      </div>
    );
  }

  return (
    <>
      {/* 📱 Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden mt-6">
        {orders.map((order) => {
          const overdue = isOverdue(order.expectedDeliveryDate, order.paymentStatus);
          const allAssignments = order.items?.flatMap(i => i.stitchAssignments || []) || [];
          
          return (
          <div 
            key={order.id} 
            className={cn("bg-card rounded-2xl border p-4 shadow-sm flex flex-col gap-3 transition-colors", overdue ? "border-red-300 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10" : "border-border")}
          >
            <div className="flex justify-between items-start">
              <div>
                {order.expectedDeliveryDate ? (
                  <div className={cn("flex items-center gap-1.5 text-sm font-black", overdue ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                    <Clock className="w-4 h-4" />
                    Due: {new Date(order.expectedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {overdue && <span className="text-[9px] uppercase tracking-widest ml-1 animate-pulse">(Overdue)</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-black text-muted-foreground/50">
                    <Clock className="w-4 h-4" /> No Date
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{order.invoiceNumber}</span>
                  {order.priority && order.priority !== 'Normal' && (
                    <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0.5 rounded-md font-bold tracking-wider uppercase border", getPriorityColor(order.priority))}>
                      {order.priority}
                    </Badge>
                  )}
                  {order.isDraft && (
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 rounded-md font-medium">DRAFT</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mt-1.5">
                  <Calendar className="w-3 h-3" />
                  Ordered: {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <Badge variant="outline" className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-sm", getStatusColor(order.paymentStatus || 'pending'))}>
                {t(`sales.${order.paymentStatus || 'pending'}`)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-border/50">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                   <User className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-sm font-bold text-foreground line-clamp-1">{order.customer?.fullName || 'Walk-in'}</span>
                   {order.customer?.phone && <span className="text-[10px] text-muted-foreground">{order.customer.phone}</span>}
                 </div>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-sm font-black text-primary">₹{(order.grandTotal || 0).toLocaleString()}</span>
                 <div className="flex items-center gap-1 mt-0.5">
                   <Badge variant="outline" className={cn("px-1.5 py-0 text-[8px] font-black uppercase tracking-tighter border", getPaymentMethodColor(order.paymentMethod))}>
                     {order.paymentMethod || 'cash'}
                   </Badge>
                 </div>
               </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Package className="w-3.5 h-3.5" />
                <span>{order.itemsCount || 0} items</span>
              </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/orders/${order.id}`} className="h-8 text-xs rounded-lg font-bold gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>
                  {onEditOrder && (
                    <Button variant="outline" size="sm" onClick={() => onEditOrder(order.id)} className="h-8 text-xs rounded-lg font-bold gap-1.5">
                      <FileEdit className="w-3.5 h-3.5" /> Edit
                    </Button>
                  )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="w-8 h-8 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem onClick={() => window.location.href = `/orders/${order.id}`} className="gap-2 font-medium">
                      <Eye className="w-4 h-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(order)} className="gap-2 font-medium">
                      {downloadingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
                    </DropdownMenuItem>
                    {onUpdateStatus && order.paymentStatus !== 'paid' && (
                      <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'paid')} className="gap-2 font-medium text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                    {onDeleteOrder && (
                      <DropdownMenuItem onClick={() => setDeleteId(order.id)} className="gap-2 font-medium text-red-600">
                        <Trash2 className="w-4 h-4" /> Delete Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {allAssignments.length > 0 && (
              <WorkflowTracker 
                invoiceId={order.id}
                stitchAssignments={allAssignments as any}
                paymentStatus={order.paymentStatus}
                dueAmount={order.dueAmount || 0}
              />
            )}
          </div>
        )})}
      </div>

      {/* 💻 Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-border/50 shadow-sm mt-6">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border">
              <th className="text-left py-4 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                Timeline & ID
              </th>
              <th className="text-left py-4 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                {t('sales.customer')}
              </th>
              <th className="text-left py-4 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                Items
              </th>
              <th className="text-left py-4 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest text-right">
                {t('sales.total')}
              </th>
              <th className="text-left py-4 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest text-center">
                Payment
              </th>
              <th className="text-left py-4 px-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest text-center">
                {t('sales.status')}
              </th>
              <th className="py-4 px-4 w-16"></th>
            </tr>
          </thead>
          {orders.map((order) => {
            const overdue = isOverdue(order.expectedDeliveryDate, order.paymentStatus);
            const allAssignments = order.items?.flatMap(i => i.stitchAssignments || []) || [];

            return (
            <tbody 
              key={order.id}
              className={cn(
                "group bg-card border-b border-border hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors",
                overdue ? "bg-red-50/10 dark:bg-red-950/10 hover:bg-red-50/30 dark:hover:bg-red-950/30" : ""
              )}
            >
              <tr>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1.5">
                    {order.expectedDeliveryDate ? (
                      <div className={cn("flex items-center gap-1.5 text-sm font-black", overdue ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                        <Clock className="w-4 h-4" />
                        Due: {new Date(order.expectedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {overdue && <span className="text-[9px] uppercase tracking-widest ml-1 animate-pulse">(Overdue)</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm font-black text-muted-foreground/50">
                        <Clock className="w-4 h-4" /> No Date
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{order.invoiceNumber}</span>
                      {order.priority && order.priority !== 'Normal' && (
                        <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0.5 rounded-md font-bold tracking-wider uppercase border", getPriorityColor(order.priority))}>
                          {order.priority}
                        </Badge>
                      )}
                      {order.isDraft && (
                        <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 rounded-md font-medium">DRAFT</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Ordered: {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-sm font-bold text-foreground line-clamp-1">{order.customer?.fullName || 'Walk-in Customer'}</span>
                      {order.customer?.phone && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
                          <Phone className="w-3 h-3" />
                          <span>{order.customer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-tight">Customer</span>
                        {order.paymentStatus === 'pending' && order.dueAmount && order.dueAmount > 0 && (
                          <div className="flex items-center gap-1 text-[8px] text-amber-600 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>Due: ₹{order.dueAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                      <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{order.itemsCount || 0}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">items</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-primary">₹{(order.grandTotal || 0).toLocaleString()}</span>
                      </div>
                      {order.advancePaid ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-medium">
                            <span>Paid:</span>
                            <span>₹{order.advancePaid.toLocaleString()}</span>
                          </div>
                          {order.dueAmount && order.dueAmount > 0 ? (
                            <div className="flex items-center gap-1 text-[9px] text-amber-600 font-medium">
                              <span>Due:</span>
                              <span>₹{order.dueAmount.toLocaleString()}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        order.dueAmount && order.dueAmount > 0 ? (
                          <div className="flex items-center gap-1 text-[9px] text-amber-600 font-medium">
                            <span>Due:</span>
                            <span>₹{order.dueAmount.toLocaleString()}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm flex items-center gap-1",
                        getPaymentMethodColor(order.paymentMethod)
                      )}
                    >
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span>{order.paymentMethod || 'cash'}</span>
                    </Badge>
                    {order.paymentStatus === 'pending' && order.dueAmount && order.dueAmount > 0 && (
                      <span className="text-[8px] text-amber-600 font-medium">Partial</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-sm",
                      getStatusColor(order.paymentStatus || 'pending')
                    )}
                  >
                    {t(`sales.${order.paymentStatus || 'pending'}`)}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = `/orders/${order.id}`} 
                      className="h-8 text-xs rounded-lg font-bold gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-border/50 animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest px-4 py-3">Order Controls</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => onEditOrder && onEditOrder(order.id)}
                        className="gap-3 px-4 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg transition-colors"
                      >
                        <FileEdit className="h-4 w-4" />
                        <span className="font-bold text-sm">Edit Order</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      <DropdownMenuItem 
                        onClick={() => handleDownload(order)} 
                        disabled={downloadingId === order.id}
                        className="gap-3 px-4 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg transition-colors"
                      >
                        {downloadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="font-bold text-sm">{downloadingId === order.id ? 'Generating...' : 'Download Invoice'}</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {onUpdateStatus && order.paymentStatus !== 'paid' && (
                        <DropdownMenuItem 
                          onClick={() => onUpdateStatus(order.id, 'paid')}
                          className="gap-3 px-4 py-2.5 cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-bold text-sm">Mark as Paid</span>
                        </DropdownMenuItem>
                      )}
                      
                      {onUpdateStatus && order.paymentStatus === 'paid' && (
                        <DropdownMenuItem 
                          onClick={() => onUpdateStatus(order.id, 'pending')}
                          className="gap-3 px-4 py-2.5 cursor-pointer text-amber-600 focus:bg-amber-50 focus:text-amber-600 rounded-lg transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          <span className="font-bold text-sm">Revert to Pending</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {onDeleteOrder && (
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(order.id)}
                          className="gap-3 px-4 py-2.5 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="font-bold text-sm">Cancel & Delete</span>
                        </DropdownMenuItem>
                      )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
              {allAssignments.length > 0 && (
                <tr>
                  <td colSpan={7} className="px-4 pb-4 pt-0 border-b-0 border-t-0">
                    <WorkflowTracker 
                      invoiceId={order.id}
                      stitchAssignments={allAssignments as any}
                      paymentStatus={order.paymentStatus}
                      dueAmount={order.dueAmount || 0}
                    />
                  </td>
                </tr>
              )}
              <tr className="h-4 bg-slate-100/70 dark:bg-slate-950/80 pointer-events-none">
                <td colSpan={7} className="p-0 border-none"></td>
              </tr>
            </tbody>
            );
          })}
        </table>
      </div>
      <ConfirmDeleteDialog 
        isOpen={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        onConfirm={handleDelete}
        description="Are you sure you want to delete this order? This action will void the invoice and restore fabric stock levels if applicable."
      />
      
      <OrderDetailsModal
        isOpen={!!detailsOrderId}
        onClose={handleCloseDetails}
        order={orderDetails}
        onUpdateOrder={handleUpdateOrder}
      />
    </>
  );
}
