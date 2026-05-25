'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  UserPlus, 
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
  Camera,
  X as CloseIcon,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useCameraContext } from '@/context/CameraContext';
import MobileCameraButton from '@/components/camera/MobileCameraButton';
import { useAuth } from '@/context/AuthContext';
import { Label } from '@/components/ui/label';

interface AddCustomerModalProps {
  onClose: () => void;
  onAdd: (customer: {
    fullName: string;
    email?: string;
    phone: string;
    city?: string;
    photoUrl?: string;
  }) => Promise<void>;
}

export default function AddCustomerModal({ onClose, onAdd }: AddCustomerModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    photoUrl: '',
  });
  const { deviceStatus } = useCameraContext();
  const { user } = useAuth();
  const adminUserId = user?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAdd({
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        city: formData.city || undefined,
        photoUrl: formData.photoUrl || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-10 pt-10 pb-8 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">
                {t('customers.addCustomer')}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                Register New Client Membership
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-8">
          <div className="space-y-8">
            {/* Primary Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-500/50" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Personal Identity</h4>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                  Full Customer Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-14 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold text-lg shadow-inner focus-visible:ring-indigo-500/20"
                    placeholder="e.g. Alexander Pierce"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-black shadow-inner"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="group space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1">
                    City/Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner"
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                </div>
              </div>

              <div className="group space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-indigo-500 transition-colors ml-1 flex items-center justify-between">
                  Email Address
                  <span className="text-[9px] font-medium opacity-40 lowercase tracking-normal">Optional for digital invoices</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 pl-12 rounded-2xl border-border bg-slate-50/50 dark:bg-slate-900/10 font-bold shadow-inner focus-visible:ring-indigo-500/20"
                    placeholder="hello@customer.com"
                  />
                </div>
              </div>
            </div>

              {/* Profile Photo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4 text-indigo-500/50" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">Profile Image</h4>
                </div>

                <div className="flex items-center gap-6">
                  {formData.photoUrl ? (
                    <div className="relative group/photo">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-indigo-500/10 shadow-xl group-hover/photo:scale-105 transition-transform">
                        <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/30">
                      <User className="w-10 h-10" />
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Capture or upload a customer profile photo for better identification.
                    </p>
                    <div className="flex items-center gap-2">
                      {adminUserId && deviceStatus !== 'unpaired' && (
                        <MobileCameraButton
                          context="customer"
                          label="Take Profile Photo"
                          onPhotoReady={(url) => setFormData({ ...formData, photoUrl: url })}
                          adminUserId={adminUserId}
                          variant="outline"
                          size="sm"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black uppercase tracking-widest h-9"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const body = new FormData();
                              body.append('photo', file);
                              body.append('context', 'customer');
                              const res = await fetch('/api/camera/upload', {
                                method: 'POST',
                                body,
                              });
                              const data = await res.json();
                              if (data.success) {
                                setFormData({ ...formData, photoUrl: data.data.url });
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        Upload Local
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <DialogFooter className="pt-8 border-t border-border/50 gap-4 flex-col sm:flex-row">
            <div className="flex-1 hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Secure Data Protocol Active</span>
            </div>
            
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border-2"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl h-14 px-12 font-black italic shadow-2xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isLoading ? 'Processing...' : (
                <div className="flex items-center gap-3">
                  <BadgeCheck className="w-5 h-5" />
                  Create Profile
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
