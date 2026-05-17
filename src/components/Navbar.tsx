"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import FeedbackModal from "./FeedbackModal";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "text-white font-semibold border-b-2 border-white pb-0.5" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}


export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated" && !!session;

  return (
    <nav
      className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50 px-4"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between h-14">

        <div className="flex items-center gap-6">
          <div className="relative group/ver">
            <Link href="/" className="flex items-baseline gap-0 text-[15px] font-bold tracking-tight text-white">
              J<span className="text-emerald-500 font-light text-[17px]">∞</span>rney
            </Link>
            <span className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] text-slate-400 opacity-0 group-hover/ver:opacity-100 transition-opacity z-50">
              v{process.env.NEXT_PUBLIC_APP_VERSION} · your gaming journal
            </span>
          </div>

          {isAuthed && (
            <div className="flex items-center gap-4">
              <NavLink href="/"        label="Home"    />
              <NavLink href="/library" label="Library" />
              <NavLink href="/lists"   label="Lists"   />
              <NavLink href="/profile" label="Profile" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {status === "loading" && (
            <span className="h-7 w-24 animate-pulse rounded-md bg-slate-700" />
          )}

          {isAuthed && (
            <div className="flex items-center gap-3">
              <FeedbackModal />
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Steam avatar"
                  className="h-7 w-7 rounded-full ring-1 ring-slate-600"
                />
              )}
              <button
                onClick={() => signOut()}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          {status === "unauthenticated" && (
            <button
              onClick={() => { window.location.href = "/api/auth/steam-login"; }}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Sign in with Steam
            </button>
          )}

        </div>

      </div>
    </nav>
  );
}
