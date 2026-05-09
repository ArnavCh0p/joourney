/**
 * NextAuth configuration, extracted here so both the route handler and server
 * components can import it without dealing with the `[...nextauth]` bracket path.
 *
 * Steam auth flow overview:
 *   1. User clicks "Sign in with Steam"
 *   2. NextAuth redirects to Steam's OpenID login page (no API key needed for this step)
 *   3. Steam redirects back to /api/auth/callback/steam with the user's SteamID64 in the URL
 *   4. We fetch the public profile from the Steam Web API (STEAM_API_KEY required)
 *   5. We upsert a User row so the DB stays in sync on every sign-in
 */

import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      id: "steam",
      name: "Steam",
      type: "oauth",

      // Step 1: Redirect the user to Steam's OpenID endpoint.
      // These are OpenID 2.0 parameters — not OAuth 2.0.
      authorization: {
        url: "https://steamcommunity.com/openid/login",
        params: {
          "openid.ns": "http://specs.openid.net/auth/2.0",
          "openid.mode": "checkid_setup",
          "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
          "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
          "openid.return_to": `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
          "openid.realm": process.env.NEXTAUTH_URL,
        },
      },

      // Step 2: Steam returns the SteamID64 inside the claimed_id URL param.
      // We pull it out and treat it as the "access token" for subsequent steps.
      token: {
        url: "https://steamcommunity.com/openid/login",
        async request(context) {
          const params = context.params as Record<string, string>;
          const claimedId = params["openid.claimed_id"] ?? "";
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

          if (!process.env.STEAM_API_KEY) {
            throw new Error(
              "STEAM_API_KEY is not set. Get a free key at https://steamcommunity.com/dev/apikey"
            );
          }

          const url =
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
            `?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
          const data = await res.json();
          return data.response.players[0];
        },
      },

      // Map Steam's profile fields to NextAuth's standard User shape.
      // user.id will be the SteamID64.
      profile(player: Record<string, unknown>) {
        return {
          id: player.steamid as string,
          name: player.personaname as string,
          image: player.avatarfull as string,
          email: null,
        };
      },

      clientId: "steam",
      clientSecret: "not_applicable_for_openid",
      checks: ["none"],
    } as NextAuthOptions["providers"][number],
  ],

  callbacks: {
    // Upsert the User row every time someone signs in so the DB stays in sync
    // with their current Steam display name and avatar.
    async signIn({ user, account }) {
      if (account?.provider === "steam" && user.id) {
        await prisma.user.upsert({
          where: { steamId: user.id },
          update: {
            displayName: user.name ?? "",
            avatarUrl: user.image ?? null,
          },
          create: {
            steamId: user.id,
            displayName: user.name ?? "",
            avatarUrl: user.image ?? null,
            profileUrl: `https://steamcommunity.com/profiles/${user.id}`,
          },
        });
      }
      return true;
    },

    // Persist the SteamID64 in the JWT so API routes can identify the user.
    async jwt({ token, account }) {
      if (account?.provider === "steam") {
        token.steamId = account.access_token;
      }
      return token;
    },

    // Expose SteamID64 to client components via useSession().
    // e.g. const { data: session } = useSession(); session.user.steamId
    async session({ session, token }) {
      if (token.steamId) {
        (session.user as { steamId?: string }).steamId = token.steamId as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
