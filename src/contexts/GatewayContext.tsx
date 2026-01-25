"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { gatewaysApi } from "@/lib/api/gateways";
import type { Gateway } from "@/types";

// Special value for "All Gateways" mode
export const ALL_GATEWAYS = "__all__";

interface GatewayContextType {
  selectedGatewayId: string | null;
  setSelectedGatewayId: (gatewayId: string | null) => void;
  accessibleGateways: Gateway[];
  isLoading: boolean;
  isRootUser: boolean;
  isAllGatewaysMode: boolean;
  getGatewayName: (gatewayId: string) => string;
  // For API calls - returns undefined when in "all gateways" mode to fetch all
  effectiveGatewayId: string | undefined;
}

const GatewayContext = createContext<GatewayContextType | undefined>(undefined);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  // Fetch accessible gateways
  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ["gateways"],
    queryFn: () => gatewaysApi.list(),
    enabled: !!session?.accessToken,
  });

  // Determine if user is root/admin (has access to all gateways or can create gateways)
  const isRootUser = gateways.length > 0 && gateways.some(g => g.gatewayId === "default");

  // Check if "All Gateways" mode is active
  const isAllGatewaysMode = selectedGatewayId === ALL_GATEWAYS;

  // Get effective gateway ID for API calls (undefined means fetch all)
  const effectiveGatewayId = isAllGatewaysMode ? undefined : (selectedGatewayId || undefined);

  // Helper to get gateway name from ID
  const getGatewayName = useCallback((gatewayId: string): string => {
    const gateway = gateways.find(g => g.gatewayId === gatewayId);
    return gateway?.gatewayName || gatewayId;
  }, [gateways]);

  // Set initial gateway selection
  useEffect(() => {
    if (gateways.length > 0 && !selectedGatewayId) {
      // Check sessionStorage first, then session gateway, then first accessible gateway
      const storedGatewayId = typeof window !== "undefined" ? sessionStorage.getItem("selectedGatewayId") : null;
      const sessionGatewayId = session?.user?.gatewayId;
      
      let initialGateway: string;
      // Allow "all" to be restored for root users
      if (storedGatewayId === ALL_GATEWAYS && isRootUser) {
        initialGateway = ALL_GATEWAYS;
      } else if (storedGatewayId && gateways.some(g => g.gatewayId === storedGatewayId)) {
        initialGateway = storedGatewayId;
      } else if (sessionGatewayId && gateways.some(g => g.gatewayId === sessionGatewayId)) {
        initialGateway = sessionGatewayId;
      } else {
        initialGateway = gateways[0].gatewayId;
      }
      
      setSelectedGatewayId(initialGateway);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("selectedGatewayId", initialGateway);
      }
    }
  }, [gateways, session?.user?.gatewayId, selectedGatewayId, isRootUser]);

  // Update sessionStorage when gateway changes
  useEffect(() => {
    if (selectedGatewayId && typeof window !== "undefined") {
      sessionStorage.setItem("selectedGatewayId", selectedGatewayId);
    }
  }, [selectedGatewayId]);

  return (
    <GatewayContext.Provider
      value={{
        selectedGatewayId,
        setSelectedGatewayId,
        accessibleGateways: gateways,
        isLoading,
        isRootUser,
        isAllGatewaysMode,
        getGatewayName,
        effectiveGatewayId,
      }}
    >
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway() {
  const context = useContext(GatewayContext);
  if (context === undefined) {
    throw new Error("useGateway must be used within a GatewayProvider");
  }
  return context;
}
