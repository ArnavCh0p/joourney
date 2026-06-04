const COVER_APP_IDS = [1245620, 1086940, 892970, 730, 271590, 1172470];

// Deterministic star field via golden-ratio Halton sequence — no Math.random, no hydration mismatch
const PHI = 1.6180339887;
const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: +((i * PHI * 100) % 100).toFixed(2),
  y: +((i * PHI * 61.8) % 100).toFixed(2),
  r: ([1, 1, 1, 1.5, 1, 1, 2, 1] as number[])[i % 8],
  o: ([0.25, 0.4, 0.2, 0.5, 0.3, 0.45, 0.6, 0.22] as number[])[i % 8],
  delay: `${+(i * 0.31 % 5).toFixed(1)}s`,
  dur:   `${+(2.5 + (i % 5) * 0.55).toFixed(1)}s`,
}));

export default function SignInHero() {
  return (
    <>
      {/* ── CSS: twinkle keyframes ── */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--so); }
          50%       { opacity: calc(var(--so) * 0.2); }
        }
        .star-dot {
          animation: twinkle var(--dur, 3s) ease-in-out infinite;
        }
      `}</style>

      <div className="py-4 space-y-3">

        {/* ════════════════════ HERO ════════════════════ */}
        <div className="relative flex min-h-[480px] overflow-hidden rounded-xl border border-slate-700/30 bg-[#0f172a]">

          {/* ── Grain texture via inline SVG filter ── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-[0.055]"
            aria-hidden="true"
          >
            <filter id="hero-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hero-grain)" />
          </svg>

          {/* ── Star field ── */}
          <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden" aria-hidden="true">
            {STARS.map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white star-dot"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.r}px`,
                  height: `${s.r}px`,
                  opacity: s.o,
                  animationDelay: s.delay,
                  animationDuration: s.dur,
                  ['--so' as string]: s.o,
                }}
              />
            ))}
          </div>

          {/* ── Atmospheric emerald vignette — very subtle, top only ── */}
          <div
            className="absolute inset-x-0 top-0 h-72 pointer-events-none z-[2]"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.07) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          {/* ════ LEFT: CTA panel ════ */}
          <div className="relative z-10 w-full lg:w-[44%] flex flex-col justify-between p-9 lg:p-12 border-r border-slate-700/25">

            <div>
              {/* Eyebrow */}
              <p className="text-[9px] font-semibold tracking-[0.45em] text-slate-500 uppercase mb-8">
                Personal · Gaming Journal
              </p>

              {/* Wordmark */}
              <div className="mb-5">
                <h1 className="text-[7.5rem] font-bold text-white leading-[0.82] tracking-tighter select-none">
                  J<span className="text-emerald-400 font-extralight">∞</span>rney
                </h1>
              </div>

              {/* Tracked tagline — high contrast against the massive wordmark above */}
              <p className="text-[10px] tracking-[0.35em] text-slate-400 uppercase mb-9">
                Your  games,  written  down
              </p>

              <p className="text-[13px] text-slate-300 leading-[1.85] max-w-[32ch] mb-9">
                Connect Steam. Every session gets a journal entry — notes, music, screenshots, whatever you want to remember. Joourney keeps the record.
              </p>

              <div className="space-y-3">
                {([
                  { dot: 'bg-emerald-500', text: 'Steam library synced on every visit'        },
                  { dot: 'bg-sky-500',     text: 'Sessions — notes, music, screenshots'       },
                  { dot: 'bg-violet-500',  text: 'Status, ratings, playthroughs, and tags'    },
                ] as const).map(({ dot, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-[13px] text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 pt-7 border-t border-slate-700/35">
              <a
                href="/api/auth/steam-login"
                className="group inline-flex items-center gap-3 rounded-md bg-slate-900/90 border border-slate-600/70 border-l-[3px] border-l-emerald-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-slate-800/90 hover:border-slate-500 transition-colors shadow-xl shadow-black/50 backdrop-blur-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 233 233" fill="currentColor" className="flex-shrink-0 text-slate-300">
                  <path d="M116.5 0C52.1 0 0 52.1 0 116.5c0 56.3 40 103.5 93.5 114.2l30.7-73.5c-1.2.1-2.4.1-3.6.1-28.4 0-51.5-23.1-51.5-51.5s23.1-51.5 51.5-51.5 51.5 23.1 51.5 51.5c0 24.4-17 44.9-39.8 50.2l-25.7 61.6c.9.1 1.8.1 2.6.1 35.6 0 67.1-15.8 88.6-40.8-19.9-9.3-33.8-29.4-33.8-52.8 0-32.1 26-58.1 58.1-58.1.9 0 1.8 0 2.7.1C211.4 47.3 167.9 0 116.5 0zm4.2 95.3c-18.6 0-33.7 15.1-33.7 33.7s15.1 33.7 33.7 33.7 33.7-15.1 33.7-33.7-15.1-33.7-33.7-33.7z"/>
                </svg>
                Sign in with Steam
                <span className="ml-auto text-slate-500 group-hover:text-slate-300 transition-colors text-xs">→</span>
              </a>
              <p className="text-[11px] text-slate-600 mt-3 tracking-wide">
                Free &nbsp;·&nbsp; No separate account &nbsp;·&nbsp; Just Steam
              </p>
            </div>
          </div>

          {/* ════ RIGHT: cover collage ════ */}
          <div className="hidden lg:block flex-1 relative overflow-hidden">

            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-44 bg-gradient-to-r from-[#0f172a] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0f172a] to-transparent z-20 pointer-events-none" />

            {/* Cover stack — deepest first, opacity rising toward front */}
            <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_sm_120.jpg"
              alt="" aria-hidden className="absolute top-10 right-0 w-[340px] rounded-sm object-cover opacity-[0.15] rotate-2 shadow-2xl shadow-black/80" />
            <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/271590/capsule_sm_120.jpg"
              alt="" aria-hidden className="absolute top-20 right-10 w-[315px] rounded-sm object-cover opacity-[0.28] -rotate-1 shadow-2xl shadow-black/80" />
            <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/892970/capsule_sm_120.jpg"
              alt="" aria-hidden className="absolute top-5 right-28 w-[305px] rounded-sm object-cover opacity-[0.48] rotate-1 shadow-2xl shadow-black/80" />
            <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/capsule_sm_120.jpg"
              alt="" aria-hidden className="absolute top-28 right-44 w-[285px] rounded-sm object-cover opacity-[0.65] -rotate-1 shadow-2xl shadow-black/80" />
            <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/capsule_sm_120.jpg"
              alt="" aria-hidden className="absolute top-9 right-60 w-[270px] rounded-sm object-cover opacity-[0.82] shadow-2xl shadow-black/80" />

            {/* Floating journal card — glass over the cover art */}
            <div className="absolute bottom-6 right-5 w-[284px] z-30 rounded-lg border border-slate-600/50 bg-slate-950/88 p-4 shadow-2xl shadow-black/80 backdrop-blur-md">
              <p className="text-[9px] font-semibold tracking-[0.3em] text-slate-500 uppercase mb-3">Recent entry</p>
              <div className="flex items-start gap-3 mb-3">
                <img
                  src="https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_sm_120.jpg"
                  alt="Elden Ring"
                  className="h-8 w-[56px] rounded-sm object-cover flex-shrink-0 bg-slate-800"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-100 leading-tight">Elden Ring</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">Jun 4 · 2h 15m</p>
                </div>
              </div>
              <div className="border-l-2 border-emerald-500/60 pl-3 mb-3">
                <p className="text-[11px] text-slate-300 leading-[1.6] italic">
                  &ldquo;Finally beat Malenia after 40 attempts. The second phase is one of the best encounters I&apos;ve played — punishing but completely fair.&rdquo;
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["soulslike", "boss fight", "platinum"].map((t) => (
                  <span key={t} className="text-[9px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════ INFO STRIP ════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Status */}
          <div className="relative overflow-hidden rounded-lg border border-slate-700/40 bg-slate-900/70 p-4">
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" aria-hidden="true">
              <filter id="strip-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#strip-grain)" />
            </svg>
            <p className="text-[9px] font-semibold tracking-[0.3em] text-slate-500 uppercase mb-3">Status</p>
            <div className="divide-y divide-slate-700/40">
              {([
                { dot: 'bg-emerald-500', label: 'Playing',      n: 4  },
                { dot: 'bg-sky-500',     label: 'Completed',    n: 47 },
                { dot: 'bg-violet-500',  label: 'Replaying',    n: 2  },
                { dot: 'bg-rose-500',    label: 'Abandoned',    n: 8  },
                { dot: 'bg-amber-500',   label: 'Want to Play', n: 23 },
              ] as const).map(({ dot, label, n }) => (
                <div key={label} className="flex items-center gap-2.5 py-[9px]">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-xs text-slate-300 flex-1">{label}</span>
                  <span className="text-xs tabular-nums text-slate-500 font-medium">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Library */}
          <div className="relative overflow-hidden rounded-lg border border-slate-700/40 bg-slate-900/70 p-4">
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" aria-hidden="true">
              <use href="#strip-grain" />
              <rect width="100%" height="100%" filter="url(#strip-grain)" />
            </svg>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[9px] font-semibold tracking-[0.3em] text-slate-500 uppercase">Library</p>
              <span className="text-[10px] text-slate-600 tabular-nums">84 games</span>
            </div>
            <div className="grid grid-cols-3 gap-[3px]">
              {COVER_APP_IDS.map((appId) => (
                <img
                  key={appId}
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_sm_120.jpg`}
                  alt="" aria-hidden
                  className="w-full rounded-sm object-cover bg-slate-800 aspect-[8/3]"
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5">Synced automatically from Steam</p>
          </div>

          {/* Organize */}
          <div className="relative overflow-hidden rounded-lg border border-slate-700/40 bg-slate-900/70 p-4">
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" aria-hidden="true">
              <rect width="100%" height="100%" filter="url(#strip-grain)" />
            </svg>
            <p className="text-[9px] font-semibold tracking-[0.3em] text-slate-500 uppercase mb-3">Organize</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["soulslike", "open world", "co-op", "indie", "rpg", "roguelite", "fps", "horror", "metroidvania", "narrative", "puzzle", "strategy"].map((tag) => (
                <span key={tag} className="rounded px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700/50">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              Custom tags, named lists, and filters — built around how you actually play.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
