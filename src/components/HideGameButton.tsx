"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entryId: string;
  isHidden: boolean;
};

export default function HideGameButton({ entryId, isHidden }: Props) {
  const router = useRouter();
  const [hidden, setHidden] = useState(isHidden);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !hidden }),
      });
      setHidden(!hidden);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={hidden ? "Unhide this game" : "Hide this game from your shelf"}
      className={`flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        hidden
          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
          : "border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
      }`}
    >
      {hidden ? "Hidden" : "Hide"}
    </button>
  );
}
