"use client";

import { useSession } from "next-auth/react";
import { useGateway } from "@/contexts/GatewayContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Route guard hook for gateway-scoped routes.
 * Ensures user has access to the specified gateway.
 * When no gateways exist, user is redirected to create first gateway (onboarding).
 */
export function useGatewayRouteGuard(gatewayName: string) {
  const { data: session, status } = useSession();
  const { accessibleGateways, getGatewayName, isLoading, needsFirstGateway } = useGateway();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to be determined
    if (status === "loading" || isLoading) return;
    
    // If not authenticated, middleware should handle redirect, but as a fallback redirect to login
    if (status === "unauthenticated" || !session) {
      router.replace(`/login?callbackUrl=/${gatewayName}/dashboard`);
      return;
    }

    if (needsFirstGateway) {
      router.replace("/onboarding/create-gateway");
      return;
    }

    const gateway = accessibleGateways.find(
      (g) => (g.gatewayName || g.gatewayId).toLowerCase() === gatewayName.toLowerCase()
    );

    if (!gateway) {
      router.push("/not-found");
    }
  }, [gatewayName, accessibleGateways, isLoading, session, status, router, needsFirstGateway]);
}

/**
 * Route guard for gateway admin routes.
 * When no gateways exist, user is redirected to create first gateway (onboarding).
 */
export function useGatewayAdminRouteGuard(gatewayName: string) {
  const { data: session } = useSession();
  const { accessibleGateways, isLoading, isRootUser, needsFirstGateway } = useGateway();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) return;

    if (needsFirstGateway) {
      router.replace("/onboarding/create-gateway");
      return;
    }

    const gateway = accessibleGateways.find(
      (g) => (g.gatewayName || g.gatewayId).toLowerCase() === gatewayName.toLowerCase()
    );

    if (!gateway && !isRootUser) {
      router.push("/no-permissions");
    }
  }, [gatewayName, accessibleGateways, isLoading, session, isRootUser, router, needsFirstGateway]);
}

/**
 * Route guard hook for root admin routes
 * Ensures user is a root/admin user. When no gateways exist, redirects to onboarding.
 */
export function useRootAdminRouteGuard() {
  const { data: session } = useSession();
  const { isRootUser, isLoading, needsFirstGateway } = useGateway();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) return;

    if (needsFirstGateway) {
      router.replace("/onboarding/create-gateway");
      return;
    }

    if (!isRootUser) {
      router.push("/no-permissions");
    }
  }, [isRootUser, isLoading, session, router, needsFirstGateway]);
}

/**
 * Get gateway slug/ID from gateway name (URL param). Uses gatewayName or gatewayId as slug.
 */
export function getGatewayIdFromName(
  gatewayName: string,
  accessibleGateways: Array<{ gatewayId: string; gatewayName?: string }>
): string | null {
  const gateway = accessibleGateways.find(
    (g) => (g.gatewayName || g.gatewayId).toLowerCase() === gatewayName.toLowerCase()
  );
  return gateway?.gatewayId || null;
}
