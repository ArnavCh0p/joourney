"use client";

import { useState, useRef, useEffect } from "react";

type FeedbackType = "Bug" | "Idea" | "Other";

export default function FeedbackModal() {
  const [open, setOpen]         = useState(false);
  const [type, setType]         = useState<FeedbackType>("Idea");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState(false);
  const backdropRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setMessage("");
    setType("Idea");
    setSent(false);
    setError(false);
  }

  async function submit() {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        Feedback
      </button>

      {open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === backdropRef.current) close(); }}
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <span className="text-2xl">✓</span>
                <p className="text-sm text-slate-300 text-center">Thanks for the feedback!</p>
                <button
                  onClick={close}
                  className="mt-2 rounded-md px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-slate-100 mb-4">Send feedback</h2>

                <div className="mb-3">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="Bug">Bug</option>
                    <option value="Idea">Idea</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <textarea
                  autoFocus
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submit(); }}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none resize-none mb-4"
                />

                {error && (
                  <p className="text-xs text-rose-400 mb-3">Something went wrong — try again.</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={close}
                    className="rounded-md px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={!message.trim() || sending}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
