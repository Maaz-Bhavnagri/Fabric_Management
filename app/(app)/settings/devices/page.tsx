'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Smartphone, Plus, Trash2, Pencil, Wifi, WifiOff,
  Clock, RefreshCw, QrCode, ArrowRight, Shield, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCameraContext, type PairedDevice } from '@/context/CameraContext';
import PairingModal from '@/components/camera/PairingModal';
import { useAuth } from '@/context/AuthContext';

export default function DevicesPage() {
  const { devices, deviceStatus, isLoadingDevices, refreshDevices, adminUserId } = useCameraContext();
  const [showPairing, setShowPairing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();
  const resolvedAdminId = user?.id || '';

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/camera/pair?id=${id}`, { method: 'DELETE' });
      await refreshDevices();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await fetch(`/api/camera/pair?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: editName.trim() }),
      });
      await refreshDevices();
      setEditingId(null);
    } catch { /* non-fatal */ }
  };

  const formatLastSeen = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return 'Never connected';
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(lastSeen).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const activeDevices = devices.filter(d => d.isActive);
  const inactiveDevices = devices.filter(d => !d.isActive);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Mobile Devices</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Pair your phone as a wireless camera for photos and uploads
          </p>
        </div>
        <Button
          onClick={() => setShowPairing(true)}
          className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-bold"
        >
          <Plus className="w-4 h-4" /> Pair New Phone
        </Button>
      </div>

      {/* How it works */}
      <Card className="p-6 border-none shadow-md shadow-black/5 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-1">One-Time Setup, Permanent Connection</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Scan the QR code once with your phone. After pairing, just click &quot;Take Photo with Mobile&quot; anywhere in the app — your phone opens the camera instantly with no further scanning needed.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { icon: QrCode, label: 'Scan QR once' },
                { icon: Smartphone, label: 'Phone stays paired' },
                { icon: CheckCircle2, label: 'Photos upload instantly' },
                { icon: Shield, label: 'Revoke anytime' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-none shadow-md shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{activeDevices.length}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Devices</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-none shadow-md shadow-black/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deviceStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              {deviceStatus === 'connected'
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                : <WifiOff className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-black text-foreground capitalize">{deviceStatus}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Current Status</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-none shadow-md shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">
                {activeDevices[0] ? formatLastSeen(activeDevices[0].lastSeen) : '—'}
              </p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Last Activity</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Device List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Connected Devices</h2>
          <Button variant="ghost" size="sm" onClick={refreshDevices} className="gap-1.5 rounded-xl" disabled={isLoadingDevices}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {devices.length === 0 && !isLoadingDevices && (
          <Card className="p-12 border-none shadow-md text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="font-bold text-foreground mb-1">No devices paired yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Pair your phone once to use it as a wireless camera throughout the app.
            </p>
            <Button onClick={() => setShowPairing(true)} className="rounded-xl gap-2 font-bold">
              <Plus className="w-4 h-4" /> Pair Your Phone Now
            </Button>
          </Card>
        )}

        {[...activeDevices, ...inactiveDevices].map((device: PairedDevice) => (
          <Card key={device.id} className="p-5 border-none shadow-md shadow-black/5 bg-card">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${device.isActive ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Smartphone className={`w-6 h-6 ${device.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === device.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(device.id)}
                      className="h-8 px-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 w-full max-w-[200px]"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 rounded-lg" onClick={() => handleRename(device.id)}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <p className="font-bold text-foreground truncate">{device.deviceName}</p>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">{formatLastSeen(device.lastSeen)}</span>
                  {device.browserInfo && (
                    <span className="text-[10px] text-muted-foreground/60 truncate hidden md:block max-w-[200px]">
                      {device.browserInfo.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Status + Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {device.isActive ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 text-[10px] font-bold gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground gap-1">
                    <WifiOff className="w-2.5 h-2.5" /> Inactive
                  </Badge>
                )}

                {editingId !== device.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setEditingId(device.id); setEditName(device.deviceName); }}
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600"
                  onClick={() => handleDelete(device.id)}
                  disabled={deletingId === device.id}
                  title="Remove device"
                >
                  {deletingId === device.id
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Quick use hint for active device */}
            {device.isActive && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowRight className="w-3 h-3 text-primary" />
                Open the camera app on this phone:{' '}
                <a
                  href="/camera/capture"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  /camera/capture
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Security Note */}
      <Card className="p-5 border-none shadow-md shadow-black/5 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Security Information</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <li>• QR pairing codes expire after 5 minutes and are single-use</li>
              <li>• Device tokens are stored as SHA-256 hashes — never as plain text</li>
              <li>• Remove any device here to immediately revoke its camera access</li>
              <li>• All uploaded photos are linked to your admin account</li>
            </ul>
          </div>
        </div>
      </Card>

      <PairingModal
        open={showPairing}
        onClose={() => setShowPairing(false)}
        adminUserId={resolvedAdminId}
        onDevicesPaired={refreshDevices}
      />
    </div>
  );
}
