'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMemo } from 'react';

export type CameraContext = 'product' | 'customer' | 'order' | 'measurement' | 'general' | 'complaint';

export interface PairedDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  browserInfo?: string | null;
  lastSeen?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type DeviceStatus = 'connected' | 'offline' | 'unpaired';

interface PhotoReadyPayload {
  requestId: string;
  url: string;
  context: CameraContext;
  contextId?: string;
  deviceId: string;
  uploadedAt: string;
}

interface CameraContextValue {
  devices: PairedDevice[];
  activeDevice: PairedDevice | null;
  deviceStatus: DeviceStatus;
  isLoadingDevices: boolean;
  refreshDevices: () => Promise<void>;
  requestPhoto: (
    context: CameraContext,
    contextId?: string,
    label?: string
  ) => Promise<string>; // returns URL when photo is ready
  onPhotoReady: (callback: (payload: PhotoReadyPayload) => void) => () => void;
  adminUserId: string | null;
}

const CameraCtx = createContext<CameraContextValue | null>(null);

export function CameraProvider({ children, adminUserId }: { children: React.ReactNode; adminUserId: string | null }) {
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('unpaired');
  const supabase = useMemo(() => createClient(), []);
  
  // Map of requestId => { resolve, reject } for pending photo requests
  const pendingRequests = useRef<Map<string, { resolve: (url: string) => void; reject: (e: Error) => void }>>(new Map());
  // Photo-ready listeners
  const photoListeners = useRef<Set<(payload: PhotoReadyPayload) => void>>(new Set());

  const activeDevice = devices.find(d => d.isActive) || null;

  const refreshDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    try {
      const res = await fetch('/api/camera/pair');
      const data = await res.json();
      if (data.success) {
        setDevices(data.data);
        const active = data.data.find((d: PairedDevice) => d.isActive);
        setDeviceStatus(active ? 'connected' : 'unpaired');
      }
    } catch {
      /* non-fatal */
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  // Subscribe to Supabase Realtime for the admin's pairing channel and device channel
  useEffect(() => {
    if (!adminUserId) return;

    // Listen for pair_success events (when phone scans QR and pairs)
    const adminChannel = supabase.channel(`camera-admin-${adminUserId}`);
    adminChannel
      .on('broadcast', { event: 'pair_success' }, () => {
        refreshDevices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(adminChannel);
    };
  }, [adminUserId, supabase, refreshDevices]);

  // Subscribe to active device's channel for photo_ready events
  useEffect(() => {
    if (!activeDevice) return;

    const deviceChannel = supabase.channel(`camera-device-${activeDevice.id}`);
    deviceChannel
      .on('broadcast', { event: 'photo_ready' }, (msg) => {
        const payload = msg.payload as PhotoReadyPayload;
        
        // Resolve pending request promise if exists
        const pending = pendingRequests.current.get(payload.requestId);
        if (pending) {
          pending.resolve(payload.url);
          pendingRequests.current.delete(payload.requestId);
        }

        // Notify all photo-ready listeners
        photoListeners.current.forEach(listener => listener(payload));
      })
      .subscribe((status) => {
        setDeviceStatus(status === 'SUBSCRIBED' ? 'connected' : 'offline');
      });

    return () => {
      supabase.removeChannel(deviceChannel);
    };
  }, [activeDevice, supabase]);

  // Load initial devices on mount
  useEffect(() => {
    if (adminUserId) refreshDevices();
  }, [adminUserId, refreshDevices]);

  const requestPhoto = useCallback(async (
    context: CameraContext,
    contextId?: string,
    label?: string
  ): Promise<string> => {
    if (!activeDevice) throw new Error('No device paired');

    const res = await fetch('/api/camera/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: activeDevice.id,
        context,
        contextId,
        label: label || 'Take a Photo',
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to signal device');

    const { requestId } = data.data;

    // Return a promise that resolves when photo_ready arrives (timeout 60s)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingRequests.current.delete(requestId);
        reject(new Error('Photo capture timed out. Please try again.'));
      }, 60_000);

      pendingRequests.current.set(requestId, {
        resolve: (url) => { clearTimeout(timer); resolve(url); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
    });
  }, [activeDevice]);

  const onPhotoReady = useCallback((callback: (payload: PhotoReadyPayload) => void) => {
    photoListeners.current.add(callback);
    return () => photoListeners.current.delete(callback);
  }, []);

  return (
    <CameraCtx.Provider value={{
      devices,
      activeDevice,
      deviceStatus,
      isLoadingDevices,
      refreshDevices,
      requestPhoto,
      onPhotoReady,
      adminUserId,
    }}>
      {children}
    </CameraCtx.Provider>
  );
}

export function useCameraContext() {
  const ctx = useContext(CameraCtx);
  if (!ctx) throw new Error('useCameraContext must be used within CameraProvider');
  return ctx;
}
