"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnhideButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function unhide() {
    setSaving(true);
    try {
      await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: false }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={unhide}
      disabled={saving}
      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
    >
      {saving ? "…" : "unhide"}
    </button>
  );
}
