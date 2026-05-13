"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SteamCallbackPage() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("steamId");

  useEffect(() => {
    if (steamId) {
      signIn("steam", { steamId, callbackUrl: "/" });
    }
  }, [steamId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-zinc-400">Signing you in...</p>
    </div>
  );
}
