"use client";

import { useGateway } from "@/contexts/GatewayContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GatewayBadgeProps {
  gatewayId: string;
  className?: string;
  /** Only show badge when in "All Gateways" mode */
  showOnlyInAllMode?: boolean;
}

/**
 * A badge that displays the gateway name.
 * When showOnlyInAllMode is true, only renders when viewing all gateways.
 * By default (showOnlyInAllMode=false), the badge is always visible.
 */
export function GatewayBadge({ gatewayId, className, showOnlyInAllMode = false }: GatewayBadgeProps) {
  const { isAllGatewaysMode, getGatewayName } = useGateway();

  // Only show when in "All Gateways" mode (unless explicitly overridden)
  if (showOnlyInAllMode && !isAllGatewaysMode) {
    return null;
  }

  const gatewayName = getGatewayName(gatewayId);

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "text-xs font-normal bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        className
      )}
    >
      {gatewayName}
    </Badge>
  );
}
