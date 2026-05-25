'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Ruler, 
  ChevronUp, 
  ChevronDown, 
  Camera, 
  Image as ImageIcon, 
  X, 
  CheckCircle2,
  ZoomIn
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CustomerMeasurementInput } from '@/lib/app-types';
import PhotoViewer from '@/components/common/PhotoViewer';
import { useCameraContext } from '@/context/CameraContext';
import MobileCameraButton from '@/components/camera/MobileCameraButton';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface CustomerMeasurementsSectionProps {
  value: CustomerMeasurementInput;
  onChange: (value: CustomerMeasurementInput) => void;
  disabled?: boolean;
}

const FIELDS = [
  { key: 'chest', label: 'Chest', unit: 'in' },
  { key: 'waist', label: 'Waist', unit: 'in' },
  { key: 'shoulder', label: 'Shoulder', unit: 'in' },
  { key: 'length', label: 'Length', unit: 'in' },
  { key: 'hip', label: 'Hip', unit: 'in' },
  { key: 'neck', label: 'Neck', unit: 'in' },
  { key: 'sleeve', label: 'Sleeve', unit: 'in' },
  { key: 'inseam', label: 'Inseam', unit: 'in' },
];

export default function CustomerMeasurementsSection({
  value,
  onChange,
  disabled = false,
}: CustomerMeasurementsSectionProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'fields' | 'photo'>('fields');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { adminUserId } = useCameraContext();
  const { user } = useAuth();
  const { t } = useLanguage();
  const resolvedAdminId = user?.id || '';

  useEffect(() => {
    if (value.photoFile) {
      const url = URL.createObjectURL(value.photoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (value.photoUrl) {
      setPreviewUrl(value.photoUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [value.photoFile, value.photoUrl]);

  const set = (patch: Partial<CustomerMeasurementInput>) => {
    onChange({ ...value, ...patch });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      set({ photoFile: file });
    }
  };

  const removePhoto = () => {
    set({ photoFile: undefined, photoUrl: undefined });
    if (fileRef.current) fileRef.current.value = '';
  };

  const parseNum = (val: string) => {
    if (val === '') return '';
    const n = parseFloat(val);
    return isNaN(n) ? '' : n;
  };

  const filled = Object.entries(value).some(([k, v]) => k !== 'photoFile' && k !== 'photoUrl' && v !== '' && v !== undefined && v !== null);

  return (
    <div className="rounded-2xl border border-border bg-slate-50/50 dark:bg-slate-900/10 overflow-hidden shadow-sm transition-all group-focus-within:border-primary/30">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Ruler className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground tracking-tight">{t('sales.quick.measurements', 'Customer Measurements')}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest leading-none mt-0.5">{t('measure.optionalDetails', 'Optional Profile Details')}</span>
          </div>
          {filled && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-[10px] font-black uppercase tracking-widest px-2 h-5">
              {t('measure.added', 'Added')}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/50 px-5 pb-6 pt-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Tabs */}
          <div className="mb-6 flex items-center bg-muted/50 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setTab('fields')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                tab === 'fields'
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                  : 'text-muted-foreground hover:bg-white/50'
              }`}
            >
              <Ruler className="h-3.5 w-3.5" />
              {t('measure.chart', 'Chart')}
            </button>
            <button
              type="button"
              onClick={() => setTab('photo')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                tab === 'photo'
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                  : 'text-muted-foreground hover:bg-white/50'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {t('measure.photo', 'Photo')}
              {value.photoFile && (
                <span className="ml-1 rounded-full bg-emerald-500 h-1.5 w-1.5 animate-pulse" />
              )}
            </button>
          </div>

          {tab === 'fields' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {FIELDS.map((f) => (
                  <div key={f.key} className="group-field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                      {t(`measure.${f.key}` as any, f.label)} <span className="opacity-50 lowercase tracking-normal">({f.unit})</span>
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={value[f.key as keyof CustomerMeasurementInput] as number | '' ?? ''}
                      onChange={(e) => set({ [f.key]: parseNum(e.target.value) })}
                      disabled={disabled}
                      className="h-10 rounded-xl border-border bg-white dark:bg-slate-950 font-black text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('measure.customNotes', 'Custom Fitting Notes')}</label>
                <Input
                  placeholder="e.g. broad shoulders, prefer loose fit, special sleeve style..."
                  value={value.customNotes ?? ''}
                  onChange={(e) => set({ customNotes: e.target.value })}
                  disabled={disabled}
                  className="h-11 rounded-xl border-border bg-white dark:bg-slate-950 font-bold"
                />
              </div>
            </div>
          )}

          {tab === 'photo' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <ImageIcon className="w-4 h-4" />
                <p className="text-[11px] font-black uppercase tracking-widest">Measurement Sheet Upload</p>
              </div>
              
              {previewUrl ? (
                <div className="relative inline-block group-photo">
                  <button
                    type="button"
                    onClick={() => setViewingPhoto(true)}
                    className="relative group/zoom rounded-2xl overflow-hidden border border-border"
                  >
                    <img
                      src={previewUrl}
                      alt="Measurement preview"
                      className="max-h-60 object-contain bg-white rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/zoom:bg-black/20 flex items-center justify-center transition-all rounded-2xl">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/zoom:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 shadow-lg p-1 text-white hover:bg-red-600 active:scale-95 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mobile Camera Option */}
                  {resolvedAdminId && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <MobileCameraButton
                        context="measurement"
                        label="Take Measurement Photo"
                        onPhotoReady={(url) => set({ photoUrl: url, photoFile: undefined })}
                        adminUserId={resolvedAdminId}
                        variant="default"
                        size="sm"
                      />
                      <span className="text-xs text-muted-foreground">or</span>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={disabled}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Upload from device
                      </button>
                    </div>
                  )}
                  {/* File drop zone */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled}
                    className="flex h-28 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-white dark:bg-slate-950 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary group-upload"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black">Choose photo from device</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">JPG, PNG, WebP — max 10MB</span>
                    </div>
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFile}
                className="hidden"
                disabled={disabled}
              />
              {value.photoFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold truncate">{value.photoFile.name} ({(value.photoFile.size / 1024).toFixed(0)} KB)</span>
                  <span className="text-[10px] font-black uppercase tracking-widest ml-auto opacity-70 italic">Ready to upload</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewingPhoto && previewUrl && (
        <PhotoViewer
          src={previewUrl}
          alt="Measurement photo"
          onClose={() => setViewingPhoto(false)}
        />
      )}
    </div>
  )
}
