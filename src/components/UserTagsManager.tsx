"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TagEntry = { tag: string; count: number };

export default function UserTagsManager({ initialTags }: { initialTags: TagEntry[] }) {
  const router = useRouter();
  const [tags, setTags]               = useState<TagEntry[]>(initialTags);
  const [renaming, setRenaming]       = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [busy, setBusy]               = useState(false);

  async function doRename(oldTag: string) {
    const newTag = renameInput.trim().toLowerCase();
    if (!newTag || newTag === oldTag) { setRenaming(null); return; }
    setBusy(true);
    try {
      await fetch("/api/user/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldTag, newTag }),
      });
      setTags((prev) => {
        const existing = prev.find((t) => t.tag === newTag);
        const old = prev.find((t) => t.tag === oldTag);
        if (existing && old) {
          // newTag already exists — merge counts
          return prev
            .filter((t) => t.tag !== oldTag)
            .map((t) => t.tag === newTag ? { ...t, count: t.count + old.count } : t)
            .sort((a, b) => a.tag.localeCompare(b.tag));
        }
        return prev
          .map((t) => t.tag === oldTag ? { ...t, tag: newTag } : t)
          .sort((a, b) => a.tag.localeCompare(b.tag));
      });
      setRenaming(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function doCreate() {
    const name = newTagInput.trim().toLowerCase();
    if (!name || tags.some((t) => t.tag === name)) { setNewTagInput(""); return; }
    setBusy(true);
    try {
      await fetch("/api/user/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setTags((prev) => [...prev, { tag: name, count: 0 }].sort((a, b) => a.tag.localeCompare(b.tag)));
      setNewTagInput("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(tag: string) {
    setBusy(true);
    try {
      await fetch(`/api/user/tags?tag=${encodeURIComponent(tag)}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.tag !== tag));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const createInput = (
    <div className="flex gap-2">
      <input
        type="text"
        value={newTagInput}
        onChange={(e) => setNewTagInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doCreate(); } }}
        placeholder="New tag…"
        className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
      />
      <button
        onClick={doCreate}
        disabled={!newTagInput.trim() || busy}
        className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
      >
        Add
      </button>
    </div>
  );

  if (tags.length === 0) {
    return <div className="space-y-3">{createInput}</div>;
  }

  return (
    <div className="space-y-3">
      {createInput}
      <div className="space-y-1.5">
      {tags.map(({ tag, count }) => (
        <div
          key={tag}
          className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2"
        >
          {renaming === tag ? (
            <>
              <input
                autoFocus
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  doRename(tag);
                  if (e.key === "Escape") setRenaming(null);
                }}
                className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-slate-100 focus:border-slate-400 focus:outline-none"
              />
              <button
                onClick={() => doRename(tag)}
                disabled={busy || !renameInput.trim()}
                className="text-xs text-slate-200 hover:text-white transition-colors disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => setRenaming(null)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-xs text-slate-300 capitalize">{tag}</span>
              <span className="text-[10px] text-slate-600 flex-shrink-0">
                {count} {count === 1 ? "game" : "games"}
              </span>
              <button
                onClick={() => { setRenaming(tag); setRenameInput(tag); }}
                disabled={busy}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
              >
                Rename
              </button>
              <button
                onClick={() => doDelete(tag)}
                disabled={busy}
                className="text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors disabled:opacity-40"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
