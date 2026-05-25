'use client';

import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </LanguageProvider>
    </ThemeProvider>
  );
}
