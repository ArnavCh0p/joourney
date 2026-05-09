"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  shelfEntryId: string;
};

export default function LogSessionForm({ shelfEntryId }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelfEntryId, date, notes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      setNotes("");
      setDate(today);
      setStatus("idle");
      // Refresh the server component above so the new session appears in the list.
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Session date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did this session go?"
          rows={4}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-y"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "saving" ? "Saving…" : "Log session"}
      </button>
    </form>
  );
}
