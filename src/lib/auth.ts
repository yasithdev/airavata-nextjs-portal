import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      gatewayId?: string;
      userName?: string;
      roles?: string[];
    };
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    gatewayId?: string;
    userName?: string;
    email?: string | null;
    name?: string | null;
    roles?: string[];
  }
}

const KEYCLOAK_ISSUER_DEFAULT = "http://localhost:18080/realms/default";
export function getKeycloakIssuer(): string {
  return process.env.KEYCLOAK_ISSUER || KEYCLOAK_ISSUER_DEFAULT;
}

/**
 * Build the Keycloak OIDC end session URL for federated logout.
 * Uses only client_id and post_logout_redirect_uri (no id_token_hint) so
 * Keycloak is never sent a stale token after realm wipe (e.g. cold-start).
 */
export function buildKeycloakLogoutUrl(postLogoutRedirectUri?: string): string {
  const keycloakIssuer = getKeycloakIssuer();
  const clientId = process.env.KEYCLOAK_CLIENT_ID || "pga";

  const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("client_id", clientId);

  if (postLogoutRedirectUri) {
    logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  }

  return logoutUrl.toString();
}

export const authConfig: NextAuthConfig = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "pga",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: getKeycloakIssuer(),
      authorization: {
        params: {
          prompt: "login",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
      }

      // Add user info from profile (OIDC claims from Keycloak userinfo)
      if (profile) {
        token.email = profile.email || undefined;
        token.name = profile.name || undefined;
        token.userName = profile.preferred_username || profile.email || undefined;
        // gateway_id from OIDC claim (Keycloak user attribute mapper)
        token.gatewayId = (profile as unknown as { gateway_id?: string }).gateway_id || undefined;
      }

      // Fallback: decode id_token for gateway_id if not in profile
      if (!token.gatewayId && token.idToken) {
        try {
          const payload = JSON.parse(Buffer.from((token.idToken as string).split(".")[1], "base64").toString());
          token.gatewayId = payload.gateway_id || undefined;
        } catch {
          /* ignore */
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.gatewayId = (token.gatewayId as string) || "default";
        session.user.userName = (token.userName as string) || token.email as string;
      }
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export for backwards compatibility
export const authOptions = authConfig;
