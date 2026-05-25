'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  User,
  Phone,
  Calendar,
  IndianRupee,
  Package,
  CreditCard,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  X,
  Loader2,
  MapPin,
  Mail,
  Camera,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { useCameraContext } from '@/context/CameraContext';
import MobileCameraButton from '@/components/camera/MobileCameraButton';
import { useAuth } from '@/context/AuthContext';
import type { InvoiceDetail } from '@/lib/app-types';
import { cn } from '@/lib/utils';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: InvoiceDetail | null;
  onUpdateOrder?: (id: string, updates: any) => Promise<void>;
}

export default function OrderDetailsModal({ 
  isOpen, 
  onClose, 
  order, 
  onUpdateOrder 
}: OrderDetailsModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedOrder, setEditedOrder] = useState<InvoiceDetail | null>(null);
  const { deviceStatus } = useCameraContext();
  const { user } = useAuth();
  const adminUserId = user?.id || '';

  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);

  useEffect(() => {
    if (order) {
      setEditedOrder({ ...order });
    }
    setIsEditing(false);
  }, [order]);

  const handleSave = async () => {
    if (!editedOrder || !onUpdateOrder || !order) return;
    
    setIsLoading(true);
    try {
      await onUpdateOrder(order.id, {
        paymentStatus: editedOrder.paymentStatus,
        paymentMethod: editedOrder.paymentMethod,
        notes: editedOrder.notes,
        discount: editedOrder.discount,
        tax: editedOrder.tax,
      });
      
      toast({
        title: 'Order Updated',
        description: 'Order details have been updated successfully.',
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update order',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedOrder(order ? { ...order } : null);
    setIsEditing(false);
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

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'cash':
        return <IndianRupee className="w-4 h-4" />;
      case 'upi':
        return <CreditCard className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'mixed':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <IndianRupee className="w-4 h-4" />;
    }
  };

  if (!order || !editedOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-[2rem] bg-white dark:bg-slate-950">
        <DialogHeader className="px-8 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-foreground">
                  Order Details #{order.invoiceNumber}
                </DialogTitle>
                <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">
                  Complete order information and management
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    size="sm"
                    className="rounded-xl h-9 px-4 font-black text-xs gap-2"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 px-4 font-black text-xs"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 px-4 font-black text-xs gap-2"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-9 px-3 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-8 py-6 space-y-8">
          {/* Order Status & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Order Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  {isEditing ? (
                    <Select value={editedOrder.paymentStatus} onValueChange={(value) => setEditedOrder({...editedOrder, paymentStatus: value})}>
                      <SelectTrigger className="w-32 h-8 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-sm", getStatusColor(order.paymentStatus))}>
                      {order.paymentStatus === 'paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {order.paymentStatus}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Payment Method:</span>
                  {isEditing ? (
                    <Select value={editedOrder.paymentMethod || 'cash'} onValueChange={(value) => setEditedOrder({...editedOrder, paymentMethod: value})}>
                      <SelectTrigger className="w-32 h-8 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span className="text-sm font-medium capitalize">{order.paymentMethod || 'cash'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                  <span className="text-lg font-black text-primary">₹{order.grandTotal.toLocaleString()}</span>
                </div>
                {order.advancePaid && order.advancePaid > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Advance Paid:</span>
                    <span className="text-sm font-medium text-emerald-600">₹{order.advancePaid.toLocaleString()}</span>
                  </div>
                )}
                {order.dueAmount && order.dueAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Due Amount:</span>
                    <span className="text-sm font-medium text-amber-600">₹{order.dueAmount.toLocaleString()}</span>
                  </div>
                )}
                {order.discount && order.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Discount:</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedOrder.discount || 0}
                        onChange={(e) => setEditedOrder({...editedOrder, discount: parseFloat(e.target.value) || 0})}
                        className="w-24 h-8 rounded-lg text-sm"
                      />
                    ) : (
                      <span className="text-sm font-medium text-red-600">-₹{order.discount.toLocaleString()}</span>
                    )}
                  </div>
                )}
                {order.tax && order.tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Tax:</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedOrder.tax || 0}
                        onChange={(e) => setEditedOrder({...editedOrder, tax: parseFloat(e.target.value) || 0})}
                        className="w-24 h-8 rounded-lg text-sm"
                      />
                    ) : (
                      <span className="text-sm font-medium text-blue-600">₹{order.tax.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Name:</span>
                  <p className="text-sm font-bold text-foreground">{order.customer?.fullName || 'Walk-in Customer'}</p>
                </div>
              </div>
              {order.customer?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                    <p className="text-sm font-bold text-foreground">{order.customer.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Order Date:</span>
                  <p className="text-sm font-bold text-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {order.isDraft && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="text-[8px] px-2 py-0.5 rounded-md font-medium">
                      DRAFT
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Order Items ({order.items?.length || 0})</h3>
            <div className="border border-border/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Meters</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Rate/M</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Stitching</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {order.items?.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">
                            {item.fabricVariant?.design?.designName || item.fabricVariant?.variantName || 'Product'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.fabricVariant?.color} • {item.fabricVariant?.variantName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium">{item.meters}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium">₹{item.ratePerMeter.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium">₹{item.stitchingPrice.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-bold text-primary">₹{item.lineTotal.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Order Notes</h3>
            {isEditing ? (
              <textarea
                value={editedOrder.notes || ''}
                onChange={(e) => setEditedOrder({...editedOrder, notes: e.target.value})}
                placeholder="Add order notes..."
                className="w-full min-h-[80px] p-3 border border-border rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50 dark:bg-slate-900/20"
              />
            ) : (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl min-h-[80px]">
                <p className="text-sm text-muted-foreground">
                  {order.notes || 'No notes added to this order.'}
                </p>
              </div>
            )}
          </div>

          {/* Visual Evidence / Complaints Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Visual Evidence / Documentation</h3>
              {adminUserId && deviceStatus !== 'unpaired' && (
                <MobileCameraButton
                  context="complaint"
                  contextId={order.id}
                  label="Take Evidence Photo"
                  onPhotoReady={(url) => setEvidencePhotos(prev => [...prev, url])}
                  adminUserId={adminUserId}
                  variant="outline"
                  size="sm"
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evidencePhotos.map((url, idx) => (
                <div key={idx} className="relative group/evidence aspect-square rounded-2xl overflow-hidden border border-border shadow-sm">
                  <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setEvidencePhotos(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/evidence:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {evidencePhotos.length === 0 && (
                <div className="col-span-full py-8 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-muted-foreground/40">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No visual evidence attached</p>
                </div>
              )}
            </div>
            
            {evidencePhotos.length > 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                * These photos are temporarily attached to this session. Click &quot;Save&quot; to permanently link them to the order notes.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
