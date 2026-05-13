"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type ListItem = {
  id: string;
  name: string;
  entryCount: number;
  isMember: boolean;
};

type Props = {
  entryId: string;
  currentTags: string[];
};

export default function QuickActionsMenu({ entryId, currentTags }: Props) {
  const router = useRouter();
  const buttonRef   = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [open, setOpen]               = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [loaded, setLoaded]           = useState(false);
  const [tab, setTab]                 = useState<"tags" | "lists">("tags");
  const [allTags, setAllTags]         = useState<string[]>([]);
  const [lists, setLists]             = useState<ListItem[]>([]);
  const [tags, setTags]               = useState<string[]>(currentTags);
  const [tagInput, setTagInput]       = useState("");
  const [newListName, setNewListName] = useState("");
  const [saving, setSaving]           = useState(false);
  const [dirty, setDirty]             = useState(false); // track whether a refresh is needed on close

  // Fetch tags + list membership once on first open
  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([
      fetch("/api/user/tags").then((r) => r.json()).catch(() => []),
      fetch(`/api/lists?entryId=${entryId}`).then((r) => r.json()).catch(() => []),
    ]).then(([tagData, listData]) => {
      if (Array.isArray(tagData)) setAllTags(tagData);
      if (Array.isArray(listData)) setLists(listData);
      setLoaded(true);
    });
  }, [open, loaded, entryId]);

  // Refresh the page once when the popup closes, only if changes were made
  useEffect(() => {
    if (!open && dirty) {
      router.refresh();
      setDirty(false);
    }
  }, [open, dirty, router]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (open) { setOpen(false); return; }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const dropdownWidth = 280;
      const left = Math.max(8, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 8));
      setDropdownPos({ top: rect.bottom + 6, left });
    }
    setOpen(true);
  }

  async function saveTags(next: string[]) {
    setSaving(true);
    try {
      await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      setTags(next);
      setDirty(true); // refresh happens on close, not now
    } finally {
      setSaving(false);
    }
  }

  function applyTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    setTagInput("");
    saveTags([...tags, t]);
  }

  function removeTag(tag: string) {
    saveTags(tags.filter((t) => t !== tag));
  }

  async function toggleList(listId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    await fetch(`/api/lists/${listId}/entries`, {
      method: list.isMember ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shelfEntryId: entryId }),
    });
    setLists((prev) => prev.map((l) =>
      l.id === listId
        ? { ...l, isMember: !l.isMember, entryCount: l.isMember ? l.entryCount - 1 : l.entryCount + 1 }
        : l
    ));
    setDirty(true);
  }

  async function createAndAddList() {
    const name = newListName.trim();
    if (!name) return;
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const list = await res.json();
    await fetch(`/api/lists/${list.id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shelfEntryId: entryId }),
    });
    setLists((prev) => [...prev, { id: list.id, name: list.name, entryCount: 1, isMember: true }]);
    setNewListName("");
    setDirty(true);
  }

  const unusedTags = allTags.filter((t) => !tags.includes(t));

  const dropdown = open && dropdownPos ? (
    <div
      ref={dropdownRef}
      style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999, width: 280 }}
      className="rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-slate-700/80">
        {(["tags", "lists"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "text-slate-100 border-b-2 border-white -mb-px"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!loaded ? (
        <div className="py-6 text-center">
          <p className="text-xs text-slate-500">Loading…</p>
        </div>

      ) : tab === "tags" ? (
        <div className="p-3 space-y-2.5">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-slate-700 text-slate-200 capitalize">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    disabled={saving}
                    className="text-slate-500 hover:text-slate-200 leading-none ml-0.5 disabled:opacity-40"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {unusedTags.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Your tags</p>
              <div className="flex flex-wrap gap-1.5">
                {unusedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => applyTag(tag)}
                    disabled={saving}
                    className="rounded px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 capitalize transition-colors disabled:opacity-40"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1.5 pt-1 border-t border-slate-800">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyTag(tagInput); } }}
              placeholder="New tag…"
              className="flex-1 min-w-0 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
            />
            <button
              onClick={() => applyTag(tagInput)}
              disabled={!tagInput.trim() || saving}
              className="flex-shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

      ) : (
        <div className="p-3 space-y-2">
          {lists.length === 0 && (
            <p className="text-xs text-slate-500 py-1">No lists yet — create one below.</p>
          )}

          {/* Scrollable list — capped at 5 items */}
          {lists.length > 0 && (
            <div className="max-h-[145px] overflow-y-auto space-y-1 -mx-1 px-1">
              {lists.map((list) => (
                <div key={list.id} className="flex items-center gap-2 py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate">{list.name}</p>
                    <p className="text-[10px] text-slate-600">
                      {list.entryCount} {list.entryCount === 1 ? "game" : "games"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleList(list.id)}
                    className={`flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      list.isMember
                        ? "bg-slate-600 text-slate-100 hover:bg-slate-500"
                        : "border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {list.isMember ? "✓" : "+"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5 pt-1 border-t border-slate-800">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createAndAddList(); } }}
              placeholder="New list…"
              className="flex-1 min-w-0 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
            />
            <button
              onClick={createAndAddList}
              disabled={!newListName.trim()}
              className="flex-shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              + New
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="Quick actions"
        className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors text-xs font-bold tracking-widest ${
          open
            ? "bg-white text-slate-900"
            : "bg-black/50 text-white/80 hover:bg-black/70 hover:text-white"
        }`}
      >
        ···
      </button>

      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
