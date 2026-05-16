"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

function WindowControls() {
  const [isTauri, setIsTauri] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tauri =
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined;
    setIsTauri(tauri);
    if (!tauri) return;
    (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      setIsMaximized(await win.isMaximized());
      await win.onResized(async () => {
        setIsMaximized(await win.isMaximized());
      });
    })();
  }, []);

  if (!mounted || !isTauri) return null;

  async function minimize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().minimize();
  }
  async function toggleMaximize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    const fullscreen = await win.isFullscreen();
    if (fullscreen) await win.setFullscreen(false);
    else await win.toggleMaximize();
  }
  async function closeWindow() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  }

  return (
    <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-slate-700">
      <button onClick={minimize} aria-label="Minimize"
        className="h-6 w-7 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors text-base leading-none">
        −
      </button>
      <button onClick={toggleMaximize} aria-label={isMaximized ? "Restore" : "Maximize"}
        className="h-6 w-7 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors">
        {isMaximized ? (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="0.6" width="6.4" height="6.4" /><path d="M0.6 2.6 L0.6 8.4 L6.4 8.4" />
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="0.6" y="0.6" width="7.8" height="7.8" />
          </svg>
        )}
      </button>
      <button onClick={closeWindow} aria-label="Close"
        className="h-6 w-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 rounded transition-colors text-base leading-none">
        ×
      </button>
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated" && !!session;

  return (
    <nav
      data-tauri-drag-region
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

          <WindowControls />
        </div>

      </div>
    </nav>
  );
}
