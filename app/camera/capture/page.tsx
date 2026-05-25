'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, SwitchCamera, Zap, ZapOff, X, RefreshCw,
  Upload, CheckCircle2, AlertCircle, Smartphone,
  RotateCcw, Send
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type CaptureState = 'idle' | 'standby' | 'requested' | 'preview' | 'uploading' | 'done' | 'error';

interface CaptureRequest {
  requestId: string;
  context: string;
  label: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function CameraCapturePage() {
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [captureRequest, setCaptureRequest] = useState<CaptureRequest | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Load stored credentials
  useEffect(() => {
    const storedToken = localStorage.getItem('camera_device_token');
    const storedId = localStorage.getItem('camera_device_id');
    const storedName = localStorage.getItem('camera_device_name');

    if (!storedToken || !storedId) {
      setError('No paired device found. Please scan the QR code from your admin laptop.');
      setState('error');
      return;
    }

    setDeviceToken(storedToken);
    setDeviceId(storedId);
    setDeviceName(storedName || 'My Phone');
    verifyDevice(storedToken);
  }, []);

  const verifyDevice = async (token: string) => {
    try {
      const res = await fetch(`/api/camera/confirm?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!data.success) {
        localStorage.removeItem('camera_device_token');
        localStorage.removeItem('camera_device_id');
        setError('This device has been unpaired. Please scan a new QR code.');
        setState('error');
        return;
      }
      setIsVerified(true);
      setState('standby');
    } catch {
      setError('Cannot verify device. Check internet connection.');
      setState('error');
    }
  };

  // Setup Supabase Realtime subscription for capture requests
  useEffect(() => {
    if (!isVerified || !deviceId) return;

    supabaseRef.current = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const channel = supabaseRef.current.channel(`camera-device-${deviceId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'capture_request' }, (msg) => {
        const payload = msg.payload as CaptureRequest;
        setCaptureRequest(payload);
        setCapturedImage(null);
        setCapturedBlob(null);
        setState('requested');
        // Vibrate phone (if supported)
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isVerified, deviceId]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('idle');
    } catch (e) {
      console.error(e);
      setError('Camera access denied. Please allow camera permission and reload.');
      setState('error');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const switchCamera = async () => {
    stopCamera();
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
  };

  useEffect(() => {
    if (state === 'idle' && isVerified && streamRef.current === null) {
      startCamera();
    }
  }, [facingMode, state, isVerified, startCamera]);

  const compressImage = (dataUrl: string): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1920;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve({ blob, url: canvas.toDataURL('image/jpeg', 0.85) });
        }, 'image/jpeg', 0.85);
      };
      img.src = dataUrl;
    });
  };

  const capture = async () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const { blob, url } = await compressImage(rawDataUrl);
    setCapturedBlob(blob);
    setCapturedImage(url);
    stopCamera();
    setState('preview');
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
    setState('idle');
  };

  const uploadPhoto = async () => {
    if (!capturedBlob || !deviceToken) return;
    setState('uploading');

    try {
      const formData = new FormData();
      formData.append('photo', capturedBlob, `photo_${Date.now()}.jpg`);
      formData.append('context', captureRequest?.context || 'general');
      formData.append('contextId', '');
      formData.append('requestId', captureRequest?.requestId || '');

      const res = await fetch('/api/camera/upload', {
        method: 'POST',
        headers: { 'x-device-token': deviceToken },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUploadedUrl(data.data.url);
      setState('done');
      setCaptureRequest(null);
      if ('vibrate' in navigator) navigator.vibrate(200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col select-none overflow-hidden">

      {/* Camera Viewfinder */}
      {(state === 'idle' || state === 'standby' || state === 'requested') && (
        <div className="relative flex-1 flex flex-col">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ minHeight: '60vh' }}
          />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">{deviceName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur"
              >
                {flashEnabled
                  ? <Zap className="w-5 h-5 text-yellow-400" />
                  : <ZapOff className="w-5 h-5 text-white/70" />}
              </button>
              <button
                onClick={switchCamera}
                className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur"
              >
                <SwitchCamera className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Center Context Badge */}
          {captureRequest && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20">
                📸 {captureRequest.label}
              </div>
            </div>
          )}

          {state === 'standby' && !streamRef.current && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <Smartphone className="w-10 h-10 text-white/60" />
              </div>
              <p className="text-white font-bold text-lg">Camera on Standby</p>
              <p className="text-white/50 text-sm text-center max-w-[200px]">
                Waiting for laptop to request a photo...
              </p>
              <button
                onClick={() => startCamera()}
                className="mt-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Open Camera Manually
              </button>
            </div>
          )}

          {/* Requested State Overlay */}
          {state === 'requested' && captureRequest && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur flex flex-col items-center justify-center p-6 gap-8 z-50">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <Camera className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-white font-black text-2xl">Photo Requested</h2>
                <p className="text-white/70 text-base">
                  Laptop requested a photo for <br />
                  <span className="text-white font-bold">{captureRequest.context} / {captureRequest.label}</span>
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                <button
                  onClick={() => {
                    setState('idle');
                    startCamera();
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <Camera className="w-6 h-6" /> Open Camera
                </button>
                <button
                  onClick={() => {
                    setState('standby');
                    setCaptureRequest(null);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <X className="w-6 h-6" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
            <div className="w-14" /> {/* spacer */}
            <button
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all active:scale-90 shadow-2xl"
              disabled={!streamRef.current}
            >
              <div className="w-14 h-14 bg-white rounded-full" />
            </button>
            <div className="w-14" /> {/* spacer */}
          </div>
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && capturedImage && (
        <div className="flex-1 flex flex-col">
          <img
            src={capturedImage}
            alt="Captured"
            className="flex-1 object-contain w-full bg-black"
          />
          <div className="bg-black p-6 flex gap-3">
            <button
              onClick={retake}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Retake
            </button>
            <button
              onClick={uploadPhoto}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-primary/30"
            >
              <Send className="w-5 h-5" /> Use Photo
            </button>
          </div>
        </div>
      )}

      {/* Uploading */}
      {state === 'uploading' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
            <Upload className="w-12 h-12 text-primary animate-bounce" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">Sending to Laptop...</p>
            <p className="text-white/50 text-sm mt-1">Uploading photo</p>
          </div>
          <div className="w-full max-w-xs bg-white/10 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Done */}
      {state === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">Photo Sent!</p>
            <p className="text-white/50 text-sm mt-1">Appeared on laptop screen</p>
          </div>
          {uploadedUrl && (
            <img src={uploadedUrl} alt="Uploaded" className="w-40 h-40 rounded-2xl object-cover border-2 border-emerald-500/30" />
          )}
          <button
            onClick={() => { setState('standby'); setCapturedImage(null); }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" /> Take Another
          </button>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Something went wrong</p>
            <p className="text-red-300 text-sm mt-2">{error}</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {localStorage.getItem('camera_device_token') && (
              <button
                onClick={() => { setState('standby'); setError(''); startCamera(); }}
                className="flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 rounded-2xl transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            )}
            <button
              onClick={() => window.location.href = '/camera/pair'}
              className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2"
            >
              <X className="w-4 h-4" /> Pair a new device
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
