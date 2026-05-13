"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entryId: string;
  initialTags: string[];
};

export default function TagManager({ entryId, initialTags }: Props) {
  const router = useRouter();
  const [tags, setTags]         = useState<string[]>(initialTags);
  const [allUserTags, setAllUserTags] = useState<string[]>([]);
  const [input, setInput]       = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch("/api/user/tags")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllUserTags(data); })
      .catch(() => {});
  }, []);

  async function saveTags(next: string[]) {
    setSaving(true);
    try {
      await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      setTags(next);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t)) { setInput(""); return; }
    setInput("");
    saveTags([...tags, t]);
  }

  function removeTag(tag: string) {
    saveTags(tags.filter((t) => t !== tag));
  }

  const suggestions = allUserTags.filter((t) => !tags.includes(t));

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-2">
        Your Tags {saving && <span className="text-slate-400 ml-1">saving…</span>}
      </label>

      {/* Applied tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-slate-700/60 text-slate-300 capitalize"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              disabled={saving}
              className="text-slate-500 hover:text-slate-200 ml-0.5 leading-none disabled:opacity-40"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-slate-400">No tags yet</span>
        )}
      </div>

      {/* Suggestions from other games */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">From your library</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                disabled={saving}
                className="rounded px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 capitalize transition-colors disabled:opacity-40"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(input); } }}
          placeholder="Add a tag…"
          className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
        />
        <button
          onClick={() => addTag(input)}
          disabled={!input.trim() || saving}
          className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
