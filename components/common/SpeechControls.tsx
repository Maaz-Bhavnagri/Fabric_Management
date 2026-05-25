'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: null | (() => void)
  onend: null | (() => void)
  onerror: null | (() => void)
  onresult: null | ((event: unknown) => void)
  start: () => void
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionConstructorLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

interface SpeechControlsProps {
  value: string
  onText: (text: string) => void
  language?: string
}

export function SpeechControls({ value, onText, language = 'en-IN' }: SpeechControlsProps) {
  const [Recognition, setRecognition] = useState<SpeechRecognitionConstructorLike | null>(null)
  const [listening, setListening] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setRecognition(() => getSpeechRecognition())
  }, [])

  const start = () => {
    if (!Recognition) return
    const rec = new Recognition()
    rec.lang = language
    rec.interimResults = true
    rec.continuous = false

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    rec.onresult = (event: unknown) => {
      const e = event as Partial<{
        resultIndex: number
        results: Array<Array<{ transcript: string }>>
      }>
      const results = e.results
      const resultIndex = typeof e.resultIndex === 'number' ? e.resultIndex : 0
      if (!results || !Array.isArray(results)) return

      let transcript = ''
      for (let i = resultIndex; i < results.length; i++) {
        transcript += results[i]?.[0]?.transcript ?? ''
      }
      const next = transcript.trim()
      if (next) onText(next)
    }

    rec.start()
  }

  const speak = () => {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    const text = value?.trim()
    if (!text) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = language
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/10 border border-border/50">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={start}
        disabled={!Recognition}
        aria-label="Voice input"
        className={cn(
          "h-8 w-8 rounded-lg transition-all duration-300",
          listening 
            ? "bg-primary text-white shadow-lg shadow-primary/30 animate-pulse scale-110" 
            : "text-muted-foreground hover:text-primary hover:bg-white dark:hover:bg-slate-900 shadow-none"
        )}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>
      
      <div className="w-px h-4 bg-border/40" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={speak}
        disabled={!value?.trim()}
        aria-label="Text to speech"
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-white dark:hover:bg-slate-900 transition-all"
      >
        <Volume2 className="w-4 h-4" />
      </Button>

      {listening && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 whitespace-nowrap">
          <Sparkles className="w-3 h-3 animate-spin duration-700" />
          Listening...
        </div>
      )}
    </div>
  )
}

