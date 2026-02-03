import { describe, it, expect } from "vitest";
import {
  buildCredentialsFromAccessData,
  type CredentialWithResources,
} from "@/lib/credentials-access";
import type { CredentialSummary } from "@/lib/api/credentials";

describe("buildCredentialsFromAccessData", () => {
  const userId = "user@example.com";

  it("merges owned and inherited credentials into a single list", () => {
    const ownedList: CredentialSummary[] = [
      {
        token: "owned-token-1",
        gatewayId: "default",
        name: "My SSH key",
        username: "owneduser",
        type: "SSH",
        description: "My SSH key",
        persistedTime: 1000,
      },
    ];
    const accessControlCredentials = [
      {
        token: "inherited-token-1",
        name: "Gateway credential",
        username: "shareduser",
        type: "SSH",
        description: "Gateway credential",
        persistedTime: 2000,
        ownership: "INHERITED" as const,
        source: "GATEWAY" as const,
        sourceId: "default",
        computeResources: [],
        storageResources: [],
      },
    ];

    const { credentials, ownedCredentials, inheritedCredentials } =
      buildCredentialsFromAccessData(
        ownedList,
        accessControlCredentials,
        userId
      );

    expect(credentials).toHaveLength(2);
    expect(ownedCredentials).toHaveLength(1);
    expect(inheritedCredentials).toHaveLength(1);

    expect(credentials[0].token).toBe("owned-token-1");
    expect(credentials[0].ownership).toBe("OWNED");
    expect(credentials[0].sourceId).toBe(userId);

    expect(credentials[1].token).toBe("inherited-token-1");
    expect(credentials[1].ownership).toBe("INHERITED");
    expect(credentials[1].source).toBe("GATEWAY");
  });

  it("returns only owned credentials when access control has no inherited", () => {
    const ownedList: CredentialSummary[] = [
      {
        token: "t1",
        gatewayId: "default",
        name: "",
        username: "u1",
        type: "SSH",
        persistedTime: 0,
      },
    ];

    const { credentials, ownedCredentials, inheritedCredentials } =
      buildCredentialsFromAccessData(ownedList, [], userId);

    expect(credentials).toHaveLength(1);
    expect(ownedCredentials).toHaveLength(1);
    expect(inheritedCredentials).toHaveLength(0);
    expect(credentials[0].ownership).toBe("OWNED");
  });

  it("returns only inherited when owned list is empty", () => {
    const accessControlCredentials = [
      {
        token: "inherited-1",
        name: "",
        username: "shared",
        type: "PASSWORD",
        description: "",
        persistedTime: 0,
        ownership: "INHERITED" as const,
        source: "GATEWAY" as const,
        sourceId: "default",
        computeResources: [],
        storageResources: [],
      },
    ];

    const { credentials, ownedCredentials, inheritedCredentials } =
      buildCredentialsFromAccessData([], accessControlCredentials, userId);

    expect(credentials).toHaveLength(1);
    expect(ownedCredentials).toHaveLength(0);
    expect(inheritedCredentials).toHaveLength(1);
    expect(credentials[0].ownership).toBe("INHERITED");
  });

  it("handles undefined access control credentials", () => {
    const ownedList: CredentialSummary[] = [
      {
        token: "t1",
        gatewayId: "g1",
        name: "",
        username: "u1",
        type: "SSH",
        persistedTime: 0,
      },
    ];

    const { credentials, ownedCredentials, inheritedCredentials } =
      buildCredentialsFromAccessData(ownedList, undefined, userId);

    expect(credentials).toHaveLength(1);
    expect(ownedCredentials).toHaveLength(1);
    expect(inheritedCredentials).toHaveLength(0);
  });

  it("maps owned summaries to CredentialWithResources with correct defaults", () => {
    const ownedList: CredentialSummary[] = [
      {
        token: "token-a",
        gatewayId: "g",
        name: "My credential",
        username: "alice",
        type: "PASSWORD",
        description: "Desc",
        persistedTime: 123,
      },
    ];

    const { ownedCredentials } = buildCredentialsFromAccessData(
      ownedList,
      undefined,
      userId
    );

    const cred: CredentialWithResources = ownedCredentials[0];
    expect(cred.token).toBe("token-a");
    expect(cred.name).toBe("My credential");
    expect(cred.username).toBe("alice");
    expect(cred.type).toBe("PASSWORD");
    expect(cred.description).toBe("Desc");
    expect(cred.persistedTime).toBe(123);
    expect(cred.ownership).toBe("OWNED");
    expect(cred.source).toBe("USER");
    expect(cred.sourceId).toBe(userId);
    expect(cred.computeResources).toEqual([]);
    expect(cred.storageResources).toEqual([]);
  });
});
