'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone, Camera, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';
import { Suspense } from 'react';

interface PairResult {
  deviceId: string;
  deviceToken: string;
  deviceName: string;
  realtimeChannel: string;
  adminUserId?: string;
}

function PairPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'loading' | 'confirm' | 'pairing' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [pairResult, setPairResult] = useState<PairResult | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid QR code. Please scan the code from your admin dashboard.');
      setStep('error');
      return;
    }
    // Auto-detect device name from user agent
    const ua = navigator.userAgent;
    let detected = 'My Phone';
    if (/iPhone/i.test(ua)) detected = 'iPhone';
    else if (/iPad/i.test(ua)) detected = 'iPad';
    else if (/Samsung/i.test(ua)) detected = 'Samsung Phone';
    else if (/Android/i.test(ua)) detected = 'Android Phone';
    else if (/Xiaomi|MIUI/i.test(ua)) detected = 'Xiaomi Phone';
    setDeviceName(detected);
    setStep('confirm');
  }, [token]);

  const handlePair = async () => {
    if (!token) return;
    setStep('pairing');
    try {
      const res = await fetch('/api/camera/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          deviceName,
          browserInfo: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Save device token persistently in localStorage
      const result: PairResult = data.data;
      localStorage.setItem('camera_device_token', result.deviceToken);
      localStorage.setItem('camera_device_id', result.deviceId);
      localStorage.setItem('camera_device_name', result.deviceName);
      localStorage.setItem('camera_admin_user_id', result.adminUserId || '');

      setPairResult(result);
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pairing failed. Please try again.');
      setStep('error');
    }
  };

  const openCamera = () => {
    window.location.href = '/camera/capture';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">KapadMitra</h1>
          <p className="text-slate-400 text-sm mt-1">Mobile Camera Setup</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6">

          {step === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto" />
              <p className="text-slate-400 text-sm mt-3">Verifying QR code...</p>
            </div>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-white font-bold text-lg">Connect this phone?</h2>
                <p className="text-slate-400 text-sm mt-1">Pair as a wireless camera for your store</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={e => setDeviceName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-primary/60 placeholder-slate-500"
                    placeholder="My Phone"
                  />
                </div>

                <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                  {[
                    'Pair once, use anytime',
                    'Camera opens on demand from laptop',
                    'Photos upload automatically',
                    'Revoke access anytime from settings',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePair}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-primary/30"
              >
                Pair This Device
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Shield className="w-3 h-3" />
                Secure. Encrypted. Can be revoked anytime.
              </div>
            </>
          )}

          {step === 'pairing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-white font-bold">Pairing device...</p>
              <p className="text-slate-400 text-sm mt-1">Please wait</p>
            </div>
          )}

          {step === 'success' && pairResult && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-black text-xl">Paired!</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {pairResult.deviceName} is now connected
                </p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-left space-y-2">
                <p className="text-xs text-slate-300 font-medium">What happens next:</p>
                {[
                  'Keep this page open or bookmarked',
                  'When admin clicks "Take Photo" on laptop',
                  'Your phone will show camera automatically',
                  'Photo uploads in seconds',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-primary font-bold">{i + 1}.</span> {item}
                  </div>
                ))}
              </div>
              <button
                onClick={openCamera}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-95"
              >
                Open Camera Now
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Pairing Failed</h2>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <p className="text-slate-400 text-xs">
                Please go back to your laptop and click &ldquo;Pair New Phone&rdquo; to get a fresh QR code.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          KapadMitra Store Management · Secure Device Pairing
        </p>
      </div>
    </div>
  );
}

export default function CameraPairPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    }>
      <PairPageContent />
    </Suspense>
  );
}
