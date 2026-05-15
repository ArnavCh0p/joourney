"use client";
import { useEffect, useState } from "react";

export default function TitleBar() {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== "undefined" && "__TAURI_INTERNALS__" in window);
  }, []);

  if (!isTauri) return null;

  async function minimize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    getCurrentWindow().minimize();
  }
  async function toggleMaximize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    getCurrentWindow().toggleMaximize();
  }
  async function closeWindow() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    getCurrentWindow().close();
  }

  return (
    <div
      data-tauri-drag-region
      className="h-7 flex items-center justify-end bg-slate-900 select-none px-2 border-b border-slate-800"
    >
      <div className="flex items-center gap-0.5">
        <button
          onClick={minimize}
          className="h-5 w-8 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors text-base leading-none"
          aria-label="Minimize"
        >
          −
        </button>
        <button
          onClick={toggleMaximize}
          className="h-5 w-8 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
          aria-label="Maximize"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="0.6" y="0.6" width="7.8" height="7.8" />
          </svg>
        </button>
        <button
          onClick={closeWindow}
          className="h-5 w-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 rounded transition-colors text-base leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
