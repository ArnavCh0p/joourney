import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side Steam callback handler.
 * Receives the steamId from the steam-login route and signs the user in
 * via the NextAuth credentials provider.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const steamId = searchParams.get("steamId");
  const baseUrl = new URL(req.url).origin;

  if (!steamId) {
    return NextResponse.redirect(new URL("/api/auth/signin?error=NoSteamId", req.url));
  }

  // Get CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  // Sign in via the credentials provider
  const signInRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": req.headers.get("cookie") ?? "",
    },
    body: new URLSearchParams({
      steamId,
      csrfToken,
      callbackUrl: "/",
      json: "true",
    }),
    redirect: "manual",
  });

  // Forward session cookies and redirect home
  const response = NextResponse.redirect(new URL("/", baseUrl));
  const setCookie = signInRes.headers.get("set-cookie");
  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }
  return response;
}
