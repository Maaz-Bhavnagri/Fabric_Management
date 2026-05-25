'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from 'next-themes';
import {
  Search,
  Languages,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { LanguageCode } from '@/lib/translations';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  
  const formattedUser = user ? {
    email: user.email,
    fullName: (user.user_metadata as any)?.fullName,
  } : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const languageOptions: { value: LanguageCode; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'hg', label: 'Hinglish' },
    { value: 'gu', label: 'ગુજરાતી' },
    { value: 'hi', label: 'हिंदी' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!mounted) return null;

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="fixed right-0 top-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-30 transition-all duration-300 w-full md:w-[calc(100%-var(--sidebar-width))]">
      <style jsx global>{`
        :root {
          --sidebar-width: 16rem;
        }
        .md\\:ml-20 ~ header {
          --sidebar-width: 5rem;
        }
        .md\\:ml-64 ~ header {
          --sidebar-width: 16rem;
        }
      `}</style>

      {/* Left side: Search */}
      <div className="hidden md:flex items-center relative w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="text"
          placeholder={t('common.search') || 'Search everything...'}
          className="pl-10 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all ring-offset-background h-10 rounded-xl"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex md:hidden font-bold text-primary text-xl tracking-tight pl-10">KapadMitra</div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Date Display - Hidden on very small screens */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border/50">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{currentDate}</span>
        </div>

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 h-10 w-10">
              <Languages className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1 shadow-xl border-border/50">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('settings.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            {languageOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setLanguage(option.value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${language === option.value ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help Button */}
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 h-10 w-10">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </Button>

        <div className="w-px h-6 bg-border mx-1 hidden md:block" />

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-all duration-200 group">
              {loading ? (
                <div className="flex items-center gap-3 px-1">
                  <Skeleton className="w-8 h-8 rounded-xl" />
                  <div className="hidden lg:flex flex-col gap-1.5">
                    <Skeleton className="w-24 h-3 rounded-full" />
                    <Skeleton className="w-16 h-2 rounded-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Avatar className="w-9 h-9 rounded-xl border-2 border-transparent group-hover:border-primary/20 transition-all">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-black rounded-xl border border-primary/20">
                        {getInitials(formattedUser?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-tight">
                    <span className="text-sm font-black text-foreground tracking-tight">
                      {formattedUser?.fullName || 'Admin User'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Store Manager</span>
                  </div>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-3xl overflow-hidden p-2 shadow-2xl border-border/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-4 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border/50">
              <p className="text-sm font-black text-foreground truncate">{formattedUser?.fullName || 'Admin'}</p>
              <p className="text-[11px] font-medium text-muted-foreground truncate">{formattedUser?.email}</p>
            </div>
            
            <DropdownMenuItem className="rounded-xl gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors group" onClick={() => router.push('/profile')}>
              <User className="w-4 h-4 text-muted-foreground group-focus:text-primary transition-colors" />
              <span className="font-bold text-sm tracking-tight">{t('nav.profile')}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="rounded-xl gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors group" onClick={() => router.push('/settings')}>
              <Settings className="w-4 h-4 text-muted-foreground group-focus:text-primary transition-colors" />
              <span className="font-bold text-sm tracking-tight">{t('nav.settings')}</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="rounded-xl gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors group" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-muted-foreground group-focus:text-primary transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground group-focus:text-primary transition-colors" />
              )}
              <span className="font-bold text-sm tracking-tight">Toggle Theme</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2 bg-border/50" />
            
            <DropdownMenuItem 
              className="rounded-xl gap-3 px-4 py-3 cursor-pointer text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-600 transition-all font-bold"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm tracking-tight">{t('nav.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
