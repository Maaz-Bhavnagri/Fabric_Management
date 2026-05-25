'use client';

import { useState, useCallback } from 'react';
import { Smartphone, Camera, Loader2, WifiOff, QrCode, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCameraContext, type CameraContext } from '@/context/CameraContext';
import PairingModal from './PairingModal';

interface MobileCameraButtonProps {
  context: CameraContext;
  contextId?: string;
  label?: string;
  onPhotoReady: (url: string) => void;
  adminUserId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export default function MobileCameraButton({
  context,
  contextId,
  label = 'Take Photo',
  onPhotoReady,
  adminUserId,
  className = '',
  variant = 'outline',
  size = 'default',
}: MobileCameraButtonProps) {
  const { activeDevice, deviceStatus, requestPhoto } = useCameraContext();
  const [capturing, setCapturing] = useState(false);
  const [showPairing, setShowPairing] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);
  const [error, setError] = useState('');

  const handleClick = useCallback(async () => {
    if (deviceStatus === 'unpaired' || !activeDevice) {
      setShowPairing(true);
      return;
    }

    setCapturing(true);
    setError('');
    try {
      const url = await requestPhoto(context, contextId, label);
      onPhotoReady(url);
      setJustCaptured(true);
      setTimeout(() => setJustCaptured(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo capture failed');
      setTimeout(() => setError(''), 5000);
    } finally {
      setCapturing(false);
    }
  }, [deviceStatus, activeDevice, requestPhoto, context, contextId, label, onPhotoReady]);

  const getButtonContent = () => {
    if (justCaptured) {
      return (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Photo received!</span>
        </>
      );
    }
    if (capturing) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for photo...</span>
        </>
      );
    }
    if (deviceStatus === 'unpaired') {
      return (
        <>
          <QrCode className="w-4 h-4" />
          <span>Connect Mobile Camera</span>
        </>
      );
    }
    if (deviceStatus === 'offline') {
      return (
        <>
          <WifiOff className="w-4 h-4 text-amber-500" />
          <span>Phone Offline</span>
        </>
      );
    }
    return (
      <>
        <Camera className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">Camera</span>
      </>
    );
  };

  const getStatusBadge = () => {
    if (deviceStatus === 'connected' && activeDevice) {
      return (
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {activeDevice.deviceName}
        </div>
      );
    }
    if (deviceStatus === 'offline') {
      return (
        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900">
          <WifiOff className="w-2.5 h-2.5" /> Offline
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className={`flex flex-col items-start gap-1 ${className}`}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={capturing}
            className="gap-2 rounded-xl"
          >
            {getButtonContent()}
          </Button>
          {deviceStatus !== 'unpaired' && (
            <button
              type="button"
              onClick={() => setShowPairing(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              title="Manage camera device"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          )}
        </div>
        {getStatusBadge()}
        {error && (
          <p className="text-[11px] text-red-500 font-medium">{error}</p>
        )}
      </div>

      <PairingModal
        open={showPairing}
        onClose={() => setShowPairing(false)}
        adminUserId={adminUserId}
        onDevicesPaired={() => {
          // CameraContext will auto-refresh via Supabase Realtime pair_success event
        }}
      />
    </>
  );
}
