'use client';

import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CameraProvider } from '@/context/CameraContext';
import { AuthProvider } from '@/context/AuthContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  // We let AuthProvider handle the auth state.
  // CameraProvider might need the adminUserId, but we can pass it later or 
  // refactor CameraProvider to use useAuth directly.
  // For now, let's leave adminUserId as null or update it inside CameraProvider.

  return (
    <AuthProvider>
      <CameraProvider adminUserId={null}>
        <div className="flex h-screen bg-background">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${
              collapsed ? 'md:ml-20' : 'md:ml-64'
            }`}
          >
            <Navbar />
            <main className="flex-1 overflow-auto pt-16">
              <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </CameraProvider>
    </AuthProvider>
  );
}
