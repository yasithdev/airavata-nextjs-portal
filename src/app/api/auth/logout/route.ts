import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Server-side logout endpoint that performs proper federated logout.
 * 
 * This endpoint:
 * 1. Gets the id_token from the server-side session (not exposed to client)
 * 2. Builds the Keycloak logout URL with id_token_hint
 * 3. Redirects to Keycloak which will:
 *    - Terminate the Keycloak session
 *    - If user logged in via CILogon, redirect to CILogon logout
 *    - Finally redirect back to our login page
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  
  const keycloakIssuer = process.env.KEYCLOAK_ISSUER;
  const postLogoutRedirectUri = `${request.nextUrl.origin}/login`;
  
  // Build Keycloak logout URL
  const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
  
  // Add id_token_hint if available (enables automatic redirect without confirmation)
  if (session?.idToken) {
    logoutUrl.searchParams.set("id_token_hint", session.idToken);
  }
  
  // Add post_logout_redirect_uri (where to go after logout)
  logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  
  // Redirect to Keycloak logout
  // This will clear Keycloak session and trigger upstream IdP logout if configured
  return NextResponse.redirect(logoutUrl.toString());
}
