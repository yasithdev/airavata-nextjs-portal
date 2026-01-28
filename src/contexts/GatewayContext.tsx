"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { gatewaysApi } from "@/lib/api/gateways";
import type { Gateway } from "@/types";

interface GatewayContextType {
  selectedGatewayId: string | null;
  setSelectedGatewayId: (gatewayId: string | null) => void;
  accessibleGateways: Gateway[];
  isLoading: boolean;
  isRootUser: boolean;
  getGatewayName: (gatewayId: string) => string;
  effectiveGatewayId: string | undefined;
  /** True when root user has no gateways – system administration only, rest disabled */
  hasNoGatewayAndIsRoot: boolean;
  /** URL for Dashboard links: /<gateway>/dashboard, or /admin/gateways when hasNoGatewayAndIsRoot */
  dashboardHref: string;
}

const GatewayContext = createContext<GatewayContextType | undefined>(undefined);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ["gateways"],
    queryFn: () => gatewaysApi.list(),
    enabled: !!session?.accessToken,
  });

  const isRootFromGateways = gateways.length > 0 && gateways.some((g) => g.gatewayId === "default");
  /** When there are no gateways, we cannot infer root from the list. Set NEXT_PUBLIC_ASSUME_ROOT_WHEN_NO_GATEWAYS=true to treat as root (system-admin-only mode). */
  const assumeRootWhenNoGateways =
    process.env.NEXT_PUBLIC_ASSUME_ROOT_WHEN_NO_GATEWAYS === "true";
  const isRootUser =
    isRootFromGateways || (gateways.length === 0 && assumeRootWhenNoGateways);
  const effectiveGatewayId = selectedGatewayId || undefined;
  const hasNoGatewayAndIsRoot = gateways.length === 0 && isRootUser;

  const getGatewayName = useCallback(
    (gatewayId: string): string => {
      const g = gateways.find((x) => x.gatewayId === gatewayId);
      return g?.gatewayName ?? gatewayId;
    },
    [gateways]
  );

  const dashboardHref = hasNoGatewayAndIsRoot
    ? "/admin/gateways"
    : selectedGatewayId && gateways.length > 0
      ? `/${getGatewayName(selectedGatewayId)}/dashboard`
      : "/default/dashboard";

  useEffect(() => {
    if (gateways.length === 0 || selectedGatewayId) return;
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("selectedGatewayId") : null;
    const sessionGw = session?.user?.gatewayId;
    let next: string;
    if (stored && gateways.some((g) => g.gatewayId === stored)) {
      next = stored;
    } else if (sessionGw && gateways.some((g) => g.gatewayId === sessionGw)) {
      next = sessionGw;
    } else {
      next = gateways[0].gatewayId;
    }
    setSelectedGatewayId(next);
    if (typeof window !== "undefined") sessionStorage.setItem("selectedGatewayId", next);
  }, [gateways, session?.user?.gatewayId, selectedGatewayId]);

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
        getGatewayName,
        effectiveGatewayId,
        hasNoGatewayAndIsRoot,
        dashboardHref,
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
