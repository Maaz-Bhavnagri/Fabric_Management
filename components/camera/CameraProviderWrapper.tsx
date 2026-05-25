'use client';

import { useAuth } from '@/context/AuthContext';
import { CameraProvider } from '@/context/CameraContext';

export function CameraProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const adminUserId = user?.id || null;

  return (
    <CameraProvider adminUserId={adminUserId}>
      {children}
    </CameraProvider>
  );
}
