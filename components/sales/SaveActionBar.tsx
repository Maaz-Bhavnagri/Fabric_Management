'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import { Save, Printer, FileEdit, Sparkles } from 'lucide-react'

interface SaveActionBarProps {
  onSaveNew: () => void
  onSavePrint: () => void
  onSaveDraft: () => void
  submitting: boolean
}

export default function SaveActionBar({
  onSaveNew,
  onSavePrint,
  onSaveDraft,
  submitting,
}: SaveActionBarProps) {
  const { t } = useLanguage()
  return (
    <div className="sticky bottom-0 z-30 mt-8 -mx-4 px-4 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-end gap-3">
        <div className="flex-1 hidden md:block">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Finalizing your order summary...</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={submitting}
            variant="outline"
            className="h-12 px-6 rounded-xl border-border font-bold text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-2"
          >
            <FileEdit className="w-4 h-4" />
            {t('sales.quick.saveDraft')}
          </Button>

          <Button
            type="button"
            onClick={onSaveNew}
            disabled={submitting}
            className="h-12 px-8 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xl shadow-black/10 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t('sales.quick.saveAndNew')}
          </Button>

          <Button
            type="button"
            onClick={onSavePrint}
            disabled={submitting}
            className="h-12 px-8 col-span-2 md:col-span-1 rounded-xl bg-primary font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
          >
            <Printer className="w-5 h-5" />
            {t('sales.quick.saveAndPrint')}
          </Button>
        </div>
      </div>
    </div>
  )
}

