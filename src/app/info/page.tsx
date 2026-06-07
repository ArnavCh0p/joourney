"use client";

import { useEffect, useState } from "react";
import { Layers, Pencil, Plus, BookOpen, Download } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Status tracking",
    description:
      "Mark games as Playing, Completed, Dropped, Backlog, and more. Your library organized the way you actually think about it.",
  },
  {
    icon: Pencil,
    title: "Bulk edit",
    description:
      "Select multiple games and update their status, type, or tags all at once. Organize a backlog of hundreds in seconds.",
  },
  {
    icon: Plus,
    title: "Add any game",
    description:
      "Not on Steam? Add games manually — older titles, other platforms, anything. Your whole library in one place.",
  },
  {
    icon: BookOpen,
    title: "Session journal",
    description:
      "Log sessions with notes, music, and screenshots. Remember how every game felt, not just how long you played.",
  },
];

const DOWNLOAD_URL = "https://github.com/ArnavCh0p/joourney/releases/latest";

export default function InfoPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined
    );
  }, []);

  return (
    <div className="max-w-xl mx-auto py-6 space-y-8">
      {!isDesktop ? (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-100">
            Your Steam library, actually organized
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Connect Steam. Joourney turns raw playtime into a real journal — sessions, notes,
            ratings, playthroughs, and more.
          </p>
        </div>
      ) : (
        <h1 className="text-xl font-bold text-zinc-100">What&apos;s in Joourney</h1>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="bg-zinc-900 rounded-lg p-5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800 flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-100">{title}</p>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {!isDesktop && (
        <div>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download for Windows
          </a>
          <p className="mt-2 text-xs text-zinc-600">Free · No separate account · Just Steam</p>
        </div>
      )}
    </div>
  );
}
