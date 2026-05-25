'use client';

import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import { CameraProvider } from '@/context/CameraContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <AuthProvider>
          <CameraProvider adminUserId={null}>
            <LanguageProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </LanguageProvider>
          </CameraProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
