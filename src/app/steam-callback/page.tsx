"use client";

import { Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SteamCallback() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("steamId");

  useEffect(() => {
    if (steamId) {
      signIn("steam", { steamId, callbackUrl: "/" });
    }
  }, [steamId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-4xl font-bold text-white tracking-tighter select-none">
        J<span className="text-emerald-400 font-extralight">∞</span>rney
      </h1>

      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
      </div>

      <p className="text-sm text-slate-400 tracking-wide">Connecting to Steam&hellip;</p>
    </div>
  );
}

export default function SteamCallbackPage() {
  return (
    <Suspense>
      <SteamCallback />
    </Suspense>
  );
}
