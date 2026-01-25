"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { GatewayProvider } from "@/contexts/GatewayContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes before garbage collection
            gcTime: 30 * 60 * 1000,
            // Don't refetch on window focus - reduces unnecessary API calls
            refetchOnWindowFocus: false,
            // Don't refetch when reconnecting - let staleTime handle it
            refetchOnReconnect: false,
            // Retry failed requests up to 2 times with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't retry on 4xx errors (client errors)
            retryOnMount: true,
          },
          mutations: {
            // Don't retry mutations by default
            retry: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <GatewayProvider>
          {children}
          <Toaster />
        </GatewayProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
