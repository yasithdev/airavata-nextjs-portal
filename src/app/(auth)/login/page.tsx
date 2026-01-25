"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Apache Airavata</h1>
          <p className="mt-2 text-gray-600">Science Gateway Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">
              {error === "OAuthSignin" && "Unable to start authentication. Please try again."}
              {error === "OAuthCallback" && "Authentication failed. Please try again."}
              {error === "OAuthCreateAccount" && "Unable to create account. Please contact support."}
              {error === "Callback" && "Authentication callback failed. Please try again."}
              {error === "AccessDenied" && "Access denied. You do not have permission to access this resource."}
              {error === "Configuration" && "Authentication service is temporarily unavailable. Please try again later."}
              {error === "RefreshAccessTokenError" && "Session expired. Please sign in again."}
              {!["OAuthSignin", "OAuthCallback", "OAuthCreateAccount", "Callback", "AccessDenied", "Configuration", "RefreshAccessTokenError"].includes(error) && `Authentication error: ${error}`}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => signIn("keycloak", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            Sign in with Keycloak
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Sign in to access computational resources and manage experiments</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
