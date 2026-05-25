'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { registerAction } from '@/actions/auth'
import { Package, Lock, Mail, User, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    
    const result = await registerAction(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-0 md:p-4 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 border border-border/50 min-h-[700px]">
        
        {/* Left Side: Branding/Illustration */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Package className="text-primary w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight italic">KapadMitra</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold text-white leading-tight">
                Join the <br/> 
                <span className="text-white/80">Kapad Mitra Family.</span>
              </h2>
              <p className="text-white/70 text-lg max-w-sm font-medium">
                Start your journey with the smartest store management platform designed for the textile industry.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 mt-auto">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
              <p className="text-white/90 text-sm font-medium mb-4 italic">
                "We grew our business by 40% after switching to KapadMitra's digital inventory management."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20" />
                <div>
                  <p className="text-white font-bold text-xs">Modern Textiles</p>
                  <p className="text-white/60 text-[10px]">Verified Business Partner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="flex flex-col justify-center p-8 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center md:text-left">
              <div className="md:hidden flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-black text-primary tracking-tight">KapadMitra</span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                {t('auth.register')}
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                Create an account to start managing your store.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <XIcon className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="Your Full Name"
                    className="h-11 pl-11 rounded-2xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground ml-1">
                  {t('auth.email')}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    className="h-11 pl-11 rounded-2xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground ml-1">
                  {t('auth.password')}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="h-11 pl-11 rounded-2xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground ml-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    className="h-11 pl-11 rounded-2xl border-border bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-4 rounded-2xl text-base font-bold dark:bg-primary dark:text-white"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t('auth.register')} <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm font-medium">
                {t('auth.alreadyHaveAccount')}
                <Link
                  href="/login"
                  className="ml-2 text-primary hover:text-primary/80 font-bold"
                >
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}
