const COVER_APP_IDS = [1245620, 1086940, 892970, 730, 271590, 1091500];

// frac(√2) for x, frac(√3) for y — algebraically independent, no streak artifacts.
const ALPHA = 0.4142135624;
const BETA  = 0.7320508076;
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: +((i * ALPHA * 100) % 100).toFixed(2),
  y: +((i * BETA  * 100) % 100).toFixed(2),
  r: ([1.5, 1, 1, 2.5, 1, 2, 3, 1] as number[])[i % 8],
  o: ([0.8, 0.9, 0.65, 1, 0.75, 0.85, 1, 0.7] as number[])[i % 8],
  delay: `${+(i * 0.31 % 5).toFixed(1)}s`,
  dur:   `${+(2.5 + (i % 5) * 0.55).toFixed(1)}s`,
}));

export default function SignInHero() {
  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--so); }
          50%       { opacity: calc(var(--so) * 0.25); }
        }
        .star-dot { animation: twinkle var(--dur, 3s) ease-in-out infinite; }
      `}</style>

      <div className="py-4 space-y-3">

        {/* ════════════════════ HERO ════════════════════ */}
        <div className="relative flex min-h-[480px] overflow-hidden rounded-xl border border-slate-600/20 bg-[#0b1628]">

          {/* ── Film grain ── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-[0.06]" aria-hidden="true">
            <filter id="hero-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hero-grain)" />
          </svg>

          {/* ── Decorative corner brackets ── */}
          <div className="absolute inset-3 z-[3] pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-slate-500/30" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-slate-500/30" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-slate-500/30" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-slate-500/30" />
          </div>

          {/* ── Star field — inside hero panel, now with correct y-distribution ── */}
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

          {/* ── Ocean atmosphere — teal horizon glow, kept subtle so stars show through ── */}
          <div
            className="absolute inset-x-0 top-0 h-64 pointer-events-none z-[2]"
            style={{ background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(20,184,166,0.09) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-[2]"
            style={{ background: 'linear-gradient(to top, rgba(6,18,40,0.45) 0%, transparent 100%)' }}
            aria-hidden="true"
          />

          {/* ════ LEFT: CTA panel ════ */}
          <div className="relative z-10 w-full lg:w-[44%] flex flex-col justify-between p-9 lg:p-12 border-r border-slate-700/20">

            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-5 bg-slate-600/60" />
                <p className="text-[9px] font-semibold tracking-[0.45em] text-slate-500 uppercase">
                  Personal · Gaming Journal
                </p>
              </div>

              {/* Wordmark */}
              <div className="mb-4">
                <h1 className="text-[7.5rem] font-bold text-white leading-[0.82] tracking-tighter select-none">
                  J<span className="text-teal-400 font-extralight">∞</span>rney
                </h1>
              </div>

              {/* Ornamental separator */}
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px w-16 bg-slate-700/70" />
                <span className="text-slate-600 text-[8px]">✦</span>
              </div>

              <p className="text-[10px] tracking-[0.32em] text-slate-500 uppercase mb-8">
                Your  games,  written  down
              </p>

              <p className="text-[13px] text-slate-300 leading-[1.85] max-w-[32ch] mb-9">
                Connect Steam. Every session gets a journal entry — notes, music, screenshots, whatever you want to remember. Joourney keeps the record.
              </p>

              <div className="space-y-3">
                {([
                  { dot: 'bg-teal-400',   text: 'Steam library synced on every visit'     },
                  { dot: 'bg-sky-400',    text: 'Sessions — notes, music, screenshots'    },
                  { dot: 'bg-violet-400', text: 'Status, ratings, playthroughs, and tags' },
                ] as const).map(({ dot, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-[13px] text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 pt-7 border-t border-slate-700/30">
              <a
                href="/api/auth/steam-login"
                className="group inline-flex items-center gap-3 rounded-md bg-slate-900/90 border border-slate-600/60 border-l-[3px] border-l-teal-400 px-5 py-3.5 text-sm font-medium text-white hover:bg-slate-800/80 hover:border-slate-500 transition-colors shadow-xl shadow-black/50 backdrop-blur-sm"
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

          {/* ════ RIGHT: pinned journal cards ════ */}
          <div className="hidden lg:block flex-1 relative overflow-hidden">

            {/* Fade the left edge into the CTA panel */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0b1628] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b1628] to-transparent z-20 pointer-events-none" />

            {/* ── Card 1: For Honor — far right, top ── */}
            <div
              className="absolute top-9 right-16 w-[272px] z-30 rounded-lg border border-slate-600/35 bg-slate-950/85 p-4 shadow-xl shadow-black/70 backdrop-blur-md"
              style={{ transform: 'rotate(2.5deg)' }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 rounded-[2px]"
                style={{ background: 'rgba(203,213,225,0.18)', border: '1px solid rgba(203,213,225,0.24)' }} />
              <div className="flex items-center gap-2.5 mb-2.5">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/304390/capsule_sm_120.jpg"
                  alt="" aria-hidden className="h-7 w-12 rounded-[3px] object-cover flex-shrink-0 bg-slate-800" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-slate-100 leading-tight truncate">For Honor</p>
                  <p className="text-[10px] text-violet-400 mt-0.5">Multiplayer · Active</p>
                </div>
              </div>
              <div className="border-l-2 border-violet-500/60 pl-2.5">
                <p className="text-[11px] text-slate-300 italic leading-relaxed">&ldquo;I PARRIED THAT I SWEAR I PARRIED THAT&rdquo;</p>
              </div>
            </div>

            {/* ── Card 2: Hollow Knight — left side, upper-mid ── */}
            <div
              className="absolute top-[110px] right-[320px] w-[210px] z-30 rounded-lg border border-slate-600/35 bg-slate-950/85 p-4 shadow-xl shadow-black/70 backdrop-blur-md"
              style={{ transform: 'rotate(-3.2deg)' }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 rounded-[2px]"
                style={{ background: 'rgba(203,213,225,0.18)', border: '1px solid rgba(203,213,225,0.24)' }} />
              <div className="flex items-center gap-2.5 mb-2">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_sm_120.jpg"
                  alt="" aria-hidden className="h-7 w-12 rounded-[3px] object-cover flex-shrink-0 bg-slate-800" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-slate-100 leading-tight">Hollow Knight</p>
                  <p className="text-[10px] text-teal-400 mt-0.5">Playing</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic leading-relaxed">&ldquo;What kinda bug am i anyway? a beetle?&rdquo;</p>
            </div>

            {/* ── Card 3: Stellaris — right side, true middle ── */}
            <div
              className="absolute top-[240px] right-[72px] w-[250px] z-30 rounded-lg border border-slate-600/35 bg-slate-950/85 p-4 shadow-xl shadow-black/70 backdrop-blur-md"
              style={{ transform: 'rotate(3.5deg)' }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 rounded-[2px]"
                style={{ background: 'rgba(203,213,225,0.18)', border: '1px solid rgba(203,213,225,0.24)' }} />
              <div className="flex items-center gap-2.5 mb-2.5">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/281990/capsule_sm_120.jpg"
                  alt="" aria-hidden className="h-7 w-12 rounded-[3px] object-cover flex-shrink-0 bg-slate-800" />
                <p className="text-[12px] font-semibold text-slate-100 leading-tight">Stellaris</p>
              </div>
              <p className="text-[11px] text-slate-400 italic leading-relaxed">
                &ldquo;The year is 2259, the slums have revolted, but I rule with an iron fist, they shall see...&rdquo;
              </p>
            </div>

            {/* ── Card 4: Cyberpunk — left side, lower-mid ── */}
            <div
              className="absolute top-[338px] right-[310px] w-[245px] z-30 rounded-lg border border-slate-600/35 bg-slate-950/85 p-4 shadow-xl shadow-black/70 backdrop-blur-md"
              style={{ transform: 'rotate(4.5deg)' }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 rounded-[2px]"
                style={{ background: 'rgba(203,213,225,0.18)', border: '1px solid rgba(203,213,225,0.24)' }} />
              <p className="text-[9px] font-semibold tracking-[0.25em] text-slate-500 uppercase mb-2">Completed</p>
              <div className="flex items-center gap-2.5 mb-2.5">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_sm_120.jpg"
                  alt="" aria-hidden className="h-7 w-12 rounded-[3px] object-cover flex-shrink-0 bg-slate-800" />
                <p className="text-[12px] font-semibold text-slate-100">Cyberpunk 2077</p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                &ldquo;I trust this Dexter DeShawn guy, seems like a real straight shooter&rdquo;
              </p>
            </div>

            {/* ── Card 5: Elden Ring — bottom, slightly right of center ── */}
            <div
              className="absolute bottom-4 right-[55px] w-[285px] z-30 rounded-lg border border-slate-600/40 bg-slate-950/90 p-4 shadow-2xl shadow-black/80 backdrop-blur-md"
              style={{ transform: 'rotate(-2deg)' }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-4 rounded-[2px]"
                style={{ background: 'rgba(203,213,225,0.18)', border: '1px solid rgba(203,213,225,0.24)' }} />
              <p className="text-[9px] font-semibold tracking-[0.3em] text-slate-500 uppercase mb-3">Recent entry</p>
              <div className="flex items-start gap-3 mb-3">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_sm_120.jpg"
                  alt="Elden Ring" className="h-8 w-[56px] rounded-sm object-cover flex-shrink-0 bg-slate-800" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-100 leading-tight">Elden Ring</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">Jun 4 · 2h 15m</p>
                </div>
              </div>
              <div className="border-l-2 border-teal-500/60 pl-3 mb-3">
                <p className="text-[11px] text-slate-300 leading-[1.6] italic">
                  &ldquo;MIQUELLA DID WHAT????What is wrong with these demigods bro&rdquo;
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
                { dot: 'bg-teal-400',   label: 'Playing',      n: 4  },
                { dot: 'bg-sky-400',    label: 'Completed',    n: 47 },
                { dot: 'bg-violet-400', label: 'Replaying',    n: 2  },
                { dot: 'bg-rose-500',   label: 'Abandoned',    n: 8  },
                { dot: 'bg-amber-500',  label: 'Want to Play', n: 23 },
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
