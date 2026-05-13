"use client";

import { useState } from "react";
import Link from "next/link";

type ListItem = {
  id: string;
  name: string;
  entryCount: number;
  previewAppIds: number[];
};

export default function ListsManager({ initialLists }: { initialLists: ListItem[] }) {
  const [lists, setLists]       = useState<ListItem[]>(initialLists);
  const [newName, setNewName]   = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  async function createList() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const list = await res.json();
      setLists((prev) => [...prev, { id: list.id, name: list.name, entryCount: 0, previewAppIds: [] }]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function deleteList(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/lists/${id}`, { method: "DELETE" });
      setLists((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Create list input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createList(); } }}
          placeholder="New list name…"
          className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
        />
        <button
          onClick={createList}
          disabled={!newName.trim() || creating}
          className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>

      {lists.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">
          No lists yet — create one above to organise your games.
        </p>
      )}

      <div className="space-y-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className="flex items-center gap-3 rounded-lg border border-slate-600/40 bg-slate-700/40 px-4 py-3 hover:bg-slate-700/60 transition-colors group"
          >
            <Link href={`/lists/${list.id}`} className="flex-1 min-w-0 flex items-center gap-3">
              {list.previewAppIds.length > 0 && (
                <div className="flex -space-x-2 flex-shrink-0">
                  {list.previewAppIds.slice(0, 3).map((appId) => (
                    <img
                      key={appId}
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`}
                      alt=""
                      className="h-8 w-14 rounded object-cover ring-1 ring-slate-600"
                    />
                  ))}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-100">{list.name}</p>
                <p className="text-xs text-slate-400">{list.entryCount} {list.entryCount === 1 ? "game" : "games"}</p>
              </div>
            </Link>

            {confirmId === list.id ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">Delete?</span>
                <button
                  onClick={() => deleteList(list.id)}
                  disabled={deletingId === list.id}
                  className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40 transition-colors"
                >
                  {deletingId === list.id ? "Deleting…" : "Yes"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(list.id)}
                className="flex-shrink-0 text-[11px] text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
