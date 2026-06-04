"use client";

import { useRouter } from "next/navigation";

type Props = { fallback: string };

export default function BackButton({ fallback }: Props) {
  const router = useRouter();
  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
    >
      ← Back
    </button>
  );
}
