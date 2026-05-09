/**
 * NextAuth route handler — catches all /api/auth/* requests (sign-in, callback, session, etc.)
 *
 * Steam uses OpenID 2.0, which is different from OAuth 2.0 that NextAuth natively supports.
 * We implement Steam as a custom OAuth-like provider by:
 *   1. Redirecting the user to Steam's OpenID login page  (no API key needed)
 *   2. Steam redirects back here with the user's SteamID64 in the URL params
 *   3. We fetch the user's public profile from the Steam Web API  (STEAM_API_KEY needed)
 *
 * Auth flow overview:
 *   User clicks "Sign in with Steam"
 *     → NextAuth redirects to https://steamcommunity.com/openid/login
 *       → Steam authenticates, redirects back to /api/auth/callback/steam
 *         → We extract the SteamID64, fetch the profile, create a session
 *
 * What you need to fill in before this works end-to-end:
 *   - STEAM_API_KEY in .env  → https://steamcommunity.com/dev/apikey
 *   - NEXTAUTH_SECRET in .env → run: openssl rand -base64 32
 *   (NEXTAUTH_URL is already set to http://localhost:3000)
 */

import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      id: "steam",
      name: "Steam",
      type: "oauth",

      // Step 1: Build the URL that sends the user to Steam's login page.
      // These are OpenID 2.0 parameters — Steam reads them to know where to send
      // the user back after they log in.
      authorization: {
        url: "https://steamcommunity.com/openid/login",
        params: {
          "openid.ns": "http://specs.openid.net/auth/2.0",
          "openid.mode": "checkid_setup",
          "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
          "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
          // Steam will redirect back to this URL after the user logs in
          "openid.return_to": `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
          "openid.realm": process.env.NEXTAUTH_URL,
        },
      },

      // Step 2: Steam redirects to /api/auth/callback/steam with params like:
      //   openid.claimed_id = https://steamcommunity.com/openid/id/76561198012345678
      // We extract the numeric SteamID64 and return it as the "access token".
      token: {
        url: "https://steamcommunity.com/openid/login",
        async request(context) {
          const params = context.params as Record<string, string>;
          const claimedId = params["openid.claimed_id"] ?? "";
          // The SteamID64 is the last path segment of the claimed_id URL
          const steamId64 = claimedId.replace(
            "https://steamcommunity.com/openid/id/",
            ""
          );
          return { tokens: { access_token: steamId64 } };
        },
      },

      // Step 3: Use the SteamID64 to fetch the player's public profile.
      // Docs: https://developer.valvesoftware.com/wiki/Steam_Web_API#GetPlayerSummaries
      userinfo: {
        async request(context) {
          const steamId = context.tokens.access_token as string;

          // FILL IN: Get your key at https://steamcommunity.com/dev/apikey
          // then set  STEAM_API_KEY="your_key_here"  in .env
          if (!process.env.STEAM_API_KEY) {
            throw new Error(
              "STEAM_API_KEY is not set in .env. " +
                "Get a free key at https://steamcommunity.com/dev/apikey"
            );
          }

          const url =
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
            `?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
          const data = await res.json();
          // GetPlayerSummaries returns an array; grab the first (and only) player
          return data.response.players[0];
        },
      },

      // Map Steam's profile fields to NextAuth's standard User shape
      profile(player: Record<string, unknown>) {
        return {
          id: player.steamid as string,          // SteamID64 (e.g. "76561198012345678")
          name: player.personaname as string,     // display name
          image: player.avatarfull as string,     // 184×184 avatar URL
          email: null,                            // Steam doesn't share email addresses
        };
      },

      // These fields are required by NextAuth's OAuth type but unused for OpenID 2.0
      clientId: "steam",
      clientSecret: "not_applicable_for_openid",
      // Disable PKCE and state checks — Steam's OpenID doesn't use the OAuth code flow
      checks: ["none"],
    } as NextAuthOptions["providers"][number],
  ],

  callbacks: {
    // After sign-in, persist the SteamID64 in the JWT so we can use it for API calls
    async jwt({ token, account }) {
      if (account?.provider === "steam") {
        token.steamId = account.access_token;
      }
      return token;
    },

    // Expose the SteamID64 to client-side code via useSession()
    // e.g. const { data: session } = useSession(); session.user.steamId
    async session({ session, token }) {
      if (token.steamId) {
        (session.user as { steamId?: string }).steamId = token.steamId as string;
      }
      return session;
    },
  },

  // FILL IN: Generate a secret with: openssl rand -base64 32
  // then set  NEXTAUTH_SECRET="your_secret"  in .env
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Next.js App Router requires named GET/POST exports instead of a default export
export { handler as GET, handler as POST };
