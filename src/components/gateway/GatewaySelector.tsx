"use client";

import { useGateway, ALL_GATEWAYS } from "@/contexts/GatewayContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectSeparator,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Globe, ShieldCheck } from "lucide-react";

export function GatewaySelector() {
  const { selectedGatewayId, setSelectedGatewayId, accessibleGateways, isLoading, isRootUser, isAllGatewaysMode, getGatewayName } = useGateway();

  if (isLoading) {
    return <Skeleton className="h-9 w-48" />;
  }

  if (accessibleGateways.length === 0) {
    return null;
  }

  // Determine which icon to show:
  // - Globe (blue) for "All Gateways" mode
  // - ShieldCheck (amber) for admin users viewing a specific gateway
  // - Server (muted) for regular users
  const GatewayIcon = isAllGatewaysMode 
    ? Globe 
    : isRootUser 
      ? ShieldCheck 
      : Server;
  
  const iconColorClass = isAllGatewaysMode 
    ? "text-blue-500" 
    : isRootUser 
      ? "text-amber-500" 
      : "text-muted-foreground";

  // Get display name for selected gateway
  const getDisplayName = () => {
    if (isAllGatewaysMode) return "All Gateways";
    if (selectedGatewayId) return getGatewayName(selectedGatewayId);
    return "Select Gateway";
  };

  return (
    <Select
      value={selectedGatewayId || ""}
      onValueChange={(value) => setSelectedGatewayId(value)}
    >
      <SelectTrigger className={`w-[220px] ${isAllGatewaysMode ? "border-blue-500" : ""}`}>
        <div className="inline-flex items-center gap-2 overflow-hidden">
          <GatewayIcon className={`h-4 w-4 flex-shrink-0 ${iconColorClass}`} />
          <span className={`truncate ${isAllGatewaysMode ? "text-blue-600" : ""}`}>
            {getDisplayName()}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* Show "All Gateways" option only for root users */}
        {isRootUser && (
          <>
            <SelectItem value={ALL_GATEWAYS} className="text-blue-600 font-medium">
              <div className="inline-flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                <span>All Gateways</span>
              </div>
            </SelectItem>
            <SelectSeparator />
          </>
        )}
        {accessibleGateways.map((gateway) => (
          <SelectItem key={gateway.gatewayId} value={gateway.gatewayId}>
            <div className="inline-flex items-center gap-2">
              {isRootUser ? (
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
              ) : (
                <Server className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              )}
              <span>{gateway.gatewayName || gateway.gatewayId}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
