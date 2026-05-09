"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  // useSession() reads the current auth state from the SessionProvider in layout.tsx.
  // status: "loading" | "authenticated" | "unauthenticated"
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900 px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between py-3">
        <span className="text-lg font-bold tracking-tight text-white">Joourney</span>

        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="cursor-pointer hover:text-white transition-colors">My Shelf</span>
          <span className="cursor-pointer hover:text-white transition-colors">Sessions</span>

          {/* Show a placeholder while NextAuth checks the session cookie */}
          {status === "loading" && (
            <span className="text-zinc-500 text-xs">Loading...</span>
          )}

          {/* Signed in — show avatar, name, and sign-out button */}
          {status === "authenticated" && session && (
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Steam avatar"
                  className="h-7 w-7 rounded-full"
                />
              )}
              <span className="text-zinc-200">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Signed out — clicking this triggers the Steam OpenID redirect */}
          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("steam")}
              className="rounded-md bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600 transition-colors"
            >
              Sign in with Steam
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
