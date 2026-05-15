"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 900);
    const hideTimer = setTimeout(() => setVisible(false), 1300);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-[#0f172a] transition-opacity duration-400
        ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <div className="w-24 h-24 rounded-2xl bg-[#0f172a] border border-slate-700/60
        flex items-center justify-center mb-6 shadow-xl">
        <span className="text-7xl font-light text-emerald-500 leading-none select-none">∞</span>
      </div>

      <div className="flex items-baseline text-3xl font-bold text-white tracking-tight">
        J<span className="text-emerald-500 font-light text-[36px]">∞</span>rney
      </div>

      <p className="mt-2 text-xs text-slate-500 tracking-widest uppercase">
        your gaming journal
      </p>
    </div>
  );
}
