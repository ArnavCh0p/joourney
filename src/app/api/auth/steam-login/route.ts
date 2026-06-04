/**
 * Custom Steam OpenID login handler.
 *
 * GET /api/auth/steam-login        → redirects user to Steam's OpenID page
 * GET /api/auth/steam-login/callback → Steam redirects here with SteamID in URL,
 *                                      we extract it and sign in via NextAuth credentials
 */

import { NextRequest, NextResponse } from "next/server";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // If Steam is returning with openid params, this is the callback
  const mode = searchParams.get("openid.mode");
  if (mode === "id_res") {
    const claimedId = searchParams.get("openid.claimed_id") ?? "";
    const steamId = claimedId.replace(
      "https://steamcommunity.com/openid/id/",
      ""
    );

    if (!steamId) {
      return NextResponse.redirect(new URL("/signin/error", req.url));
    }

    // Redirect to a client page that calls signIn() with the steamId
    const callbackUrl = new URL("/steam-callback", req.url);
    callbackUrl.searchParams.set("steamId", steamId);
    return NextResponse.redirect(callbackUrl);
  }

  // User cancelled on Steam or OpenID returned an unexpected mode
  if (mode !== null) {
    return NextResponse.redirect(new URL("/signin/error", req.url));
  }

  // Initial login — redirect to Steam OpenID
  const returnTo = new URL("/api/auth/steam-login", req.url).toString();
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.return_to": returnTo,
    "openid.realm": new URL(req.url).origin,
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}
