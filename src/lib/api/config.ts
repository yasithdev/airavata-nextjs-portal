/**
 * Portal config from API (GET /api/v1/config). Replaces NEXT_PUBLIC_* env vars.
 */
export interface PortalConfig {
  defaultGatewayId: string;
  assumeRootWhenNoGateways: boolean;
  appVersion: string;
}

const DEFAULTS: PortalConfig = {
  defaultGatewayId: "default",
  assumeRootWhenNoGateways: false,
  appVersion: "",
};

export async function fetchPortalConfig(): Promise<PortalConfig> {
  const base = typeof window !== "undefined" ? "" : process.env.API_URL || "http://localhost:8080";
  const url = `${base}/api/v1/config`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    return DEFAULTS;
  }
  const raw = (await res.json()) as Record<string, unknown>;
  return {
    defaultGatewayId:
      typeof raw.defaultGatewayId === "string" && raw.defaultGatewayId
        ? raw.defaultGatewayId
        : DEFAULTS.defaultGatewayId,
    assumeRootWhenNoGateways:
      raw.assumeRootWhenNoGateways === true || raw.assumeRootWhenNoGateways === "true",
    appVersion:
      typeof raw.appVersion === "string" ? raw.appVersion : DEFAULTS.appVersion,
  };
}
