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

export const authConfig: NextAuthConfig = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "pga",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER || "http://localhost:18080/realms/default",
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

      // Add user info from profile
      if (profile) {
        token.email = profile.email || undefined;
        token.name = profile.name || undefined;
        token.gatewayId = (profile as any).gateway_id || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
        token.userName = (profile as any).preferred_username || profile.email || "user";
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.gatewayId = (token.gatewayId as string) || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
        session.user.userName = (token.userName as string) || token.email as string || "user";
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
