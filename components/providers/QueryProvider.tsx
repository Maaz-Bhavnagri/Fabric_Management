'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import localforage from 'localforage';
import { useState, useEffect } from 'react';

// Configure localforage
localforage.config({
  name: 'FabricManage',
  storeName: 'query_cache',
  description: 'Persists React Query cache for offline access',
});

// Create a customized query client
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes before considering it stale (requires background fetch)
        staleTime: 5 * 60 * 1000, 
        // Keep data in garbage collection cache for 24 hours (good for offline persistence)
        gcTime: 24 * 60 * 60 * 1000, 
        // Refetch on window focus is great, but let's not overwhelm the server for fast navigations
        refetchOnWindowFocus: false,
        // Retry failed queries 1 time
        retry: 1,
      },
    },
  });

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: localforage,
    })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
