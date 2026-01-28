"use client";

import { useSession } from "next-auth/react";
import { useGateway } from "@/contexts/GatewayContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Route guard hook for gateway-scoped routes.
 * Ensures user has access to the specified gateway.
 * Root users with no gateways are redirected to /admin (system administration only).
 */
export function useGatewayRouteGuard(gatewayName: string) {
  const { data: session } = useSession();
  const { accessibleGateways, getGatewayName, isLoading, hasNoGatewayAndIsRoot } = useGateway();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) return;

    if (hasNoGatewayAndIsRoot) {
      router.replace("/admin/gateways");
      return;
    }

    const gateway = accessibleGateways.find(
      (g) => getGatewayName(g.gatewayId).toLowerCase() === gatewayName.toLowerCase()
    );

    if (!gateway) {
      router.push("/not-found");
    }
  }, [gatewayName, accessibleGateways, getGatewayName, isLoading, session, router, hasNoGatewayAndIsRoot]);
}

/**
 * Route guard for gateway admin routes.
 * Root users with no gateways are redirected to /admin (system administration only).
 */
export function useGatewayAdminRouteGuard(gatewayName: string) {
  const { data: session } = useSession();
  const { accessibleGateways, getGatewayName, isLoading, isRootUser, hasNoGatewayAndIsRoot } = useGateway();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) return;

    if (hasNoGatewayAndIsRoot) {
      router.replace("/admin/gateways");
      return;
    }

    const gateway = accessibleGateways.find(
      (g) => getGatewayName(g.gatewayId).toLowerCase() === gatewayName.toLowerCase()
    );

    if (!gateway && !isRootUser) {
      router.push("/no-permissions");
    }
  }, [gatewayName, accessibleGateways, getGatewayName, isLoading, session, isRootUser, router, hasNoGatewayAndIsRoot]);
}

/**
 * Route guard hook for root admin routes
 * Ensures user is a root/admin user
 */
export function useRootAdminRouteGuard() {
  const { data: session } = useSession();
  const { isRootUser, isLoading } = useGateway();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) return;

    if (!isRootUser) {
      router.push("/no-permissions");
    }
  }, [isRootUser, isLoading, session, router]);
}

/**
 * Get gateway ID from gateway name
 */
export function getGatewayIdFromName(
  gatewayName: string,
  accessibleGateways: Array<{ gatewayId: string; gatewayName?: string }>,
  getGatewayName: (gatewayId: string) => string
): string | null {
  const gateway = accessibleGateways.find(
    (g) => getGatewayName(g.gatewayId).toLowerCase() === gatewayName.toLowerCase()
  );
  return gateway?.gatewayId || null;
}
