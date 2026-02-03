import type { CredentialSummary } from "@/lib/api/credentials";

export interface CredentialWithResources {
  token: string;
  /** User-given name to identify this credential. */
  name: string;
  /** Login username is per resource (grant); may be absent. */
  username?: string | null;
  type: string;
  description: string;
  persistedTime: number;
  ownership: "OWNED" | "INHERITED";
  source: "USER" | "GROUP" | "GATEWAY";
  sourceId: string;
  computeResources: Array<{ resourceId: string; loginUsername: string }>;
  storageResources: Array<{ resourceId: string; loginUsername: string }>;
}

export interface AccessControlCredential {
  token: string;
  name?: string;
  username?: string | null;
  type: string;
  description: string;
  persistedTime: number;
  ownership: "OWNED" | "INHERITED";
  source: "USER" | "GROUP" | "GATEWAY";
  sourceId: string;
  computeResources: Array<{ resourceId: string; loginUsername: string }>;
  storageResources: Array<{ resourceId: string; loginUsername: string }>;
}

/**
 * Builds a merged list of credentials from owned summaries and the access-control API.
 * Used by the access-control UI to show both owned and inherited credentials with
 * their associated compute/storage resources and per-resource login usernames.
 * Ownership: OWNED = current user (source USER); INHERITED = from access grant (source/sourceId from API).
 */
export function buildCredentialsFromAccessData(
  ownedList: CredentialSummary[],
  accessControlCredentials: AccessControlCredential[] | undefined,
  userId: string
): {
  credentials: CredentialWithResources[];
  ownedCredentials: CredentialWithResources[];
  inheritedCredentials: CredentialWithResources[];
} {
  const inheritedFromApi: CredentialWithResources[] = (accessControlCredentials ?? [])
    .filter((c) => c.ownership === "INHERITED")
    .map((c) => ({
      ...c,
      name: c.name ?? c.description ?? "",
    }));
  const ownedAsWithResources: CredentialWithResources[] = ownedList.map((s) => ({
    token: s.token,
    name: s.name ?? s.description ?? "",
    username: s.username ?? "",
    type: s.type ?? "SSH",
    description: s.description ?? "",
    persistedTime: s.persistedTime ?? 0,
    ownership: "OWNED" as const,
    source: "USER" as const,
    sourceId: userId,
    computeResources: [],
    storageResources: [],
  }));
  const credentials: CredentialWithResources[] = [
    ...ownedAsWithResources,
    ...inheritedFromApi,
  ];
  return {
    credentials,
    ownedCredentials: ownedAsWithResources,
    inheritedCredentials: inheritedFromApi,
  };
}
