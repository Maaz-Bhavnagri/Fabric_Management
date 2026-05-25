'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone, CheckCircle2, Clock, Wifi, WifiOff,
  RefreshCw, Trash2, Plus, X, Shield, QrCode, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PairedDevice } from '@/context/CameraContext';

interface PairingModalProps {
  open: boolean;
  onClose: () => void;
  adminUserId: string;
  onDevicesPaired?: () => void;
}

type Step = 'devices' | 'generating' | 'qr' | 'success';

interface PairingData {
  pairingUrl: string;
  pairingToken: string;
  deviceId: string;
  expiresAt: string;
}

export default function PairingModal({ open, onClose, adminUserId, onDevicesPaired }: PairingModalProps) {
  const [step, setStep] = useState<Step>('devices');
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('My Phone');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/camera/pair');
      const data = await res.json();
      if (data.success) setDevices(data.data);
    } catch { /* non-fatal */ }
  };

  useEffect(() => {
    if (open) {
      setStep('devices');
      setError('');
      fetchDevices();
    }
    return () => {
      clearInterval(timerRef.current!);
      clearInterval(pollRef.current!);
    };
  }, [open]);

  // Countdown timer for QR expiry
  useEffect(() => {
    if (step === 'qr' && pairingData) {
      const expiry = new Date(pairingData.expiresAt).getTime();
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((expiry - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(timerRef.current!);
          setError('QR code expired. Please generate a new one.');
          setStep('devices');
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current!);
  }, [step, pairingData]);

  // Poll for pairing completion
  useEffect(() => {
    if (step === 'qr' && pairingData) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/camera/pair');
          const data = await res.json();
          if (data.success) {
            const newlyPaired = data.data.find(
              (d: PairedDevice) => d.id === pairingData.deviceId && d.isActive
            );
            if (newlyPaired) {
              clearInterval(pollRef.current!);
              clearInterval(timerRef.current!);
              setDevices(data.data);
              setStep('success');
              onDevicesPaired?.();
            }
          }
        } catch { /* non-fatal */ }
      }, 2000);
    }
    return () => clearInterval(pollRef.current!);
  }, [step, pairingData, onDevicesPaired]);

  const generateQR = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/camera/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: newDeviceName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPairingData(data.data);
      setTimeLeft(300);
      setStep('qr');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async (id: string) => {
    try {
      await fetch(`/api/camera/pair?id=${id}`, { method: 'DELETE' });
      setDevices(prev => prev.filter(d => d.id !== id));
      onDevicesPaired?.();
    } catch { /* non-fatal */ }
  };

  const formatLastSeen = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return 'Never';
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastSeen).toLocaleDateString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/70 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mobile Camera Setup</h2>
              <p className="text-primary-foreground/70 text-xs">Pair your phone as a wireless camera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">

          {/* Step: Devices List */}
          {step === 'devices' && (
            <div className="space-y-4">
              {devices.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Connected Devices</p>
                  {devices.map(device => (
                    <div key={device.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${device.isActive ? 'bg-emerald-500/10' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <Smartphone className={`w-5 h-5 ${device.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{device.deviceName}</p>
                        <p className="text-[11px] text-muted-foreground">Last seen: {formatLastSeen(device.lastSeen)}</p>
                      </div>
                      {device.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 text-[10px] font-bold">
                          <Wifi className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                          <WifiOff className="w-3 h-3 mr-1" /> Inactive
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => deleteDevice(device.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No devices paired yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Pair your phone once, then use it anytime</p>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl">{error}</p>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Device Name</label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="My Phone"
                  />
                </div>
                <Button onClick={generateQR} className="w-full rounded-xl gap-2 font-bold" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Pair New Phone
                </Button>
              </div>
            </div>
          )}

          {/* Step: QR Code */}
          {step === 'qr' && pairingData && (
            <div className="space-y-5 text-center">
              <div>
                <p className="text-sm font-bold text-foreground">Scan with your phone&apos;s camera</p>
                <p className="text-xs text-muted-foreground mt-1">Open your phone camera and point at this code</p>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-primary/10 inline-block">
                  <QRCodeSVG
                    value={pairingData.pairingUrl}
                    size={200}
                    level="M"
                    includeMargin={false}
                    fgColor="#1e293b"
                  />
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center justify-center gap-2 text-sm font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-amber-500'}`}>
                <Clock className="w-4 h-4" />
                Expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>

              {/* Steps */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2">
                {['Open phone camera & scan QR', 'Tap the link that appears', 'Click "Pair Device" on your phone', 'Done! Camera stays connected'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                    <span className="text-muted-foreground font-medium">{step}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('devices')} className="flex-1 rounded-xl">
                  Back
                </Button>
                <Button onClick={generateQR} variant="outline" className="flex-1 rounded-xl gap-1" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> New QR
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
                <Shield className="w-3 h-3" /> Token expires in 5 minutes. Secure & single-use.
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Phone Paired!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your phone is now ready to use as a camera. No need to scan QR again.
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 text-left">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold mb-2">
                  <Link2 className="w-4 h-4" /> What happens next
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Click &quot;Take Photo with Mobile&quot; in any form</li>
                  <li>• Your phone instantly opens camera</li>
                  <li>• Photo uploads automatically to the form</li>
                  <li>• Works every time without scanning QR again</li>
                </ul>
              </div>
              <Button onClick={onClose} className="w-full rounded-xl font-bold">
                Start Using Camera
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
