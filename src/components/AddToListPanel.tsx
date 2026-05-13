"use client";

import { useState } from "react";

type ListSummary = {
  id: string;
  name: string;
  entryCount: number;
};

type Props = {
  shelfEntryId: string;
  initialLists: ListSummary[];
  initialMemberIds: string[]; // list IDs that already contain this game
};

export default function AddToListPanel({ shelfEntryId, initialLists, initialMemberIds }: Props) {
  const [lists, setLists]           = useState<ListSummary[]>(initialLists);
  const [membership, setMembership] = useState<Set<string>>(new Set(initialMemberIds));
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);

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
      setLists((prev) => [...prev, { id: list.id, name: list.name, entryCount: 0 }]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function toggleList(listId: string) {
    const inList = membership.has(listId);
    if (inList) {
      await fetch(`/api/lists/${listId}/entries`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelfEntryId }),
      });
      setMembership((prev) => { const s = new Set(prev); s.delete(listId); return s; });
      setLists((prev) => prev.map((l) =>
        l.id === listId ? { ...l, entryCount: l.entryCount - 1 } : l
      ));
    } else {
      await fetch(`/api/lists/${listId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelfEntryId }),
      });
      setMembership((prev) => new Set([...prev, listId]));
      setLists((prev) => prev.map((l) =>
        l.id === listId ? { ...l, entryCount: l.entryCount + 1 } : l
      ));
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-500">Lists</label>

      {lists.length === 0 && (
        <p className="text-xs text-slate-400">No lists yet — create one below.</p>
      )}

      {lists.length > 0 && (
        <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
          {lists.map((list) => (
            <div key={list.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">{list.name}</p>
                <p className="text-xs text-slate-500">{list.entryCount} {list.entryCount === 1 ? "game" : "games"}</p>
              </div>
              <button
                onClick={() => toggleList(list.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  membership.has(list.id)
                    ? "bg-slate-600 text-slate-100 hover:bg-slate-500"
                    : "border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                }`}
              >
                {membership.has(list.id) ? "✓ In list" : "+ Add"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create new list inline */}
      <div className="flex gap-2 pt-1 border-t border-slate-700">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createList(); } }}
          placeholder="New list name…"
          className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
        />
        <button
          onClick={createList}
          disabled={!newName.trim() || creating}
          className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
        >
          Create
        </button>
      </div>
    </div>
  );
}
