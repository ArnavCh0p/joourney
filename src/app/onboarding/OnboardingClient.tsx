"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Game = {
  id: string;
  steamAppId: number;
  name: string;
  hours: number;
  isMultiplayer: boolean;
  genres: string[];
};

type Props = {
  games: Game[];
  restricted: boolean;
};

type StatusChoice = {
  value: string;
  label: string;
  dot: string;
};

const SP_CHOICES: StatusChoice[] = [
  { value: "PLAYING",      label: "Playing",      dot: "bg-emerald-500" },
  { value: "REPLAYING",    label: "Replaying",    dot: "bg-violet-500"  },
  { value: "COMPLETED",    label: "Completed",    dot: "bg-sky-500"     },
  { value: "WANT_TO_PLAY", label: "Want to Play", dot: "bg-amber-500"   },
  { value: "ABANDONED",    label: "Abandoned",    dot: "bg-rose-500"    },
];

const MP_CHOICES: StatusChoice[] = [
  { value: "MULTIPLAYER_ACTIVE",   label: "Active",   dot: "bg-emerald-500" },
  { value: "MULTIPLAYER_ON_BREAK", label: "On Break", dot: "bg-amber-500"   },
  { value: "MULTIPLAYER_RETIRED",  label: "Retired",  dot: "bg-rose-500"    },
];

const MP_GENRE_KEYWORDS = ["massively multiplayer", "battle royale", "mmo", "pvp"];

function guessMultiplayer(game: Game): boolean {
  if (game.isMultiplayer) return true;
  return game.genres.some((g) => MP_GENRE_KEYWORDS.some((kw) => g.toLowerCase().includes(kw)));
}

async function finishOnboarding() {
  await fetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboardingComplete: true }),
  });
}

// ─── Restricted state ──────────────────────────────────────────────────────

function RestrictedView() {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  async function proceed() {
    setFinishing(true);
    try {
      await finishOnboarding();
    } finally {
      router.push("/library");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl">

        <div className="px-7 pt-7 pb-6">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">Steam library</p>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Your library is set to private.
          </h1>
          <p className="text-slate-400 mt-3 text-sm leading-relaxed">
            Joourney reads your Steam library to pull in your games and playtime — but that requires your game details to be set to public in Steam&rsquo;s privacy settings.
          </p>
        </div>

        <div className="mx-7 border-t border-slate-800" />

        <div className="px-7 py-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-300 mb-1">What works right now</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              You can add games manually, write journal entries, log sessions, and use everything Joourney offers — your library just won&rsquo;t sync automatically from Steam.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300 mb-1">To enable Steam sync</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              In Steam, go to your profile → Edit Profile → Privacy Settings → set &ldquo;Game details&rdquo; to Public. Your library will sync automatically the next time you visit.
            </p>
          </div>
        </div>

        <div className="px-7 pb-7">
          <button
            onClick={proceed}
            disabled={finishing}
            className="w-full rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            {finishing ? "One moment…" : "Continue to my library →"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Empty state (public library, no games yet) ────────────────────────────

function EmptyView() {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  async function proceed() {
    setFinishing(true);
    try {
      await finishOnboarding();
    } finally {
      router.push("/library");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl">

        <div className="px-7 pt-7 pb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Getting started</p>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Start with a blank slate.
          </h1>
          <p className="text-slate-400 mt-3 text-sm leading-relaxed">
            We didn&rsquo;t find any games in your Steam library yet. That&rsquo;s fine — you can add games manually and start journaling straight away.
          </p>
        </div>

        <div className="mx-7 border-t border-slate-800" />

        <div className="px-7 py-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            Use the <span className="text-slate-300">+ Add game</span> button in your library to add any game — Steam or otherwise. Once you have games, you can log sessions, track playthroughs, and write reviews.
          </p>
        </div>

        <div className="px-7 pb-7">
          <button
            onClick={proceed}
            disabled={finishing}
            className="w-full rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            {finishing ? "One moment…" : "Take me to my library →"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main categorization flow ──────────────────────────────────────────────

export default function OnboardingClient({ games, restricted }: Props) {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isMP, setIsMP] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(games.map((g) => [g.id, guessMultiplayer(g)]))
  );
  const [saving, setSaving] = useState(false);

  if (restricted) return <RestrictedView />;
  if (games.length === 0) return <EmptyView />;

  function pick(gameId: string, status: string) {
    setSelections((prev) =>
      prev[gameId] === status ? { ...prev, [gameId]: "" } : { ...prev, [gameId]: status }
    );
  }

  function toggleType(gameId: string) {
    setIsMP((prev) => ({ ...prev, [gameId]: !prev[gameId] }));
    setSelections((prev) => ({ ...prev, [gameId]: "" }));
  }

  async function completeOnboarding(withUpdates: boolean) {
    setSaving(true);
    try {
      if (withUpdates) {
        const updates = Object.entries(selections).filter(([, v]) => v);
        await Promise.allSettled(
          updates.map(([id, status]) =>
            fetch(`/api/games/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            })
          )
        );
      }
      await finishOnboarding();
      router.push("/library");
    } catch {
      setSaving(false);
    }
  }

  const categorized = Object.values(selections).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Getting started</p>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
            Your library, your way.
          </h1>
          <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-lg">
            Below are your most-played games. Give each one a status — it takes about a minute — and your library will be ready to explore. Everything can be changed later.
          </p>
        </div>

        {/* Explainer */}
        <div className="px-7 pb-5">
          <div className="border-t border-slate-800 pt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">How statuses work</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Single-player</p>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Follows a narrative arc — you start, play, and eventually finish or move on.
                </p>
                <div className="space-y-1.5">
                  {SP_CHOICES.map((c) => (
                    <div key={c.value} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                      <span className="text-xs text-slate-400">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Multiplayer</p>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  No finish line — just whether it&apos;s in your current rotation.
                </p>
                <div className="space-y-1.5">
                  {MP_CHOICES.map((c) => (
                    <div key={c.value} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                      <span className="text-xs text-slate-400">{c.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Auto-detected the wrong type? Use the <span className="text-slate-400">SP / MP</span> toggle to fix it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-7 border-t border-slate-800" />

        {/* Scrollable game list */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-2">
          {games.map((game) => {
            const selected = selections[game.id];
            const mp = isMP[game.id];
            const choices = mp ? MP_CHOICES : SP_CHOICES;

            return (
              <div key={game.id} className="py-3 border-b border-slate-800/60 last:border-0">
                <div className="flex items-center gap-3 mb-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_sm_120.jpg`}
                    alt={game.name}
                    className="h-9 w-14 rounded object-cover flex-shrink-0 bg-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{game.name}</p>
                    <p className="text-xs text-slate-600">{game.hours.toLocaleString()}h played</p>
                  </div>

                  <div className="flex rounded-md overflow-hidden border border-slate-700 text-xs flex-shrink-0">
                    <button
                      onClick={() => mp && toggleType(game.id)}
                      className={`px-2.5 py-1 font-medium transition-colors ${
                        !mp ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      SP
                    </button>
                    <button
                      onClick={() => !mp && toggleType(game.id)}
                      className={`px-2.5 py-1 font-medium transition-colors border-l border-slate-700 ${
                        mp ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      MP
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pl-[68px]">
                  {choices.map((choice) => (
                    <button
                      key={choice.value}
                      onClick={() => pick(game.id, choice.value)}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        selected === choice.value
                          ? "bg-white text-slate-900"
                          : "border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${choice.dot}`} />
                      {choice.label}
                    </button>
                  ))}
                  {selected && (
                    <button
                      onClick={() => setSelections((prev) => ({ ...prev, [game.id]: "" }))}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => completeOnboarding(false)}
            disabled={saving}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
          >
            Skip, take me to my library
          </button>
          <div className="flex items-center gap-3">
            {categorized > 0 && (
              <span className="text-xs text-slate-500">{categorized} categorized</span>
            )}
            <button
              onClick={() => completeOnboarding(true)}
              disabled={saving}
              className="rounded-lg bg-white text-slate-900 px-5 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Done →"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
