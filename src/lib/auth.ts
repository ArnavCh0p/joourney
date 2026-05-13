/**
 * NextAuth configuration using a custom Steam OpenID provider.
 *
 * Steam uses OpenID 2.0, not OAuth 2.0. NextAuth doesn't support OpenID 2.0
 * natively, so we use a workaround:
 *   1. Redirect the user to Steam's OpenID login page
 *   2. Steam redirects back to our callback with the SteamID64 in the URL
 *   3. We extract the SteamID from the callback URL in the signIn callback
 *   4. We fetch the Steam profile and upsert the user in the DB
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "steam",
      name: "Steam",
      credentials: {
        steamId: { label: "Steam ID", type: "text" },
      },
      async authorize(credentials) {
        const steamId = credentials?.steamId;
        if (!steamId) return null;

        const apiKey = process.env.STEAM_API_KEY;
        if (!apiKey) throw new Error("STEAM_API_KEY is not set");

        const url =
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
          `?key=${apiKey}&steamids=${steamId}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
        const data = await res.json();
        const player = data.response.players[0];
        if (!player) return null;

        // Upsert user in DB
        await prisma.user.upsert({
          where: { steamId: player.steamid },
          update: {
            displayName: player.personaname,
            avatarUrl: player.avatarfull,
          },
          create: {
            steamId: player.steamid,
            displayName: player.personaname,
            avatarUrl: player.avatarfull,
            profileUrl: player.profileurl,
            onboardingComplete: false,
          },
        });

        return {
          id: player.steamid,
          name: player.personaname,
          image: player.avatarfull,
          email: null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.steamId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.steamId) {
        (session.user as { steamId?: string }).steamId = token.steamId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/api/auth/steam-login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
