const COVER_APP_IDS = [1245620, 1086940, 892970, 730, 271590, 1172470];

export default function SignInHero() {
  return (
    <div className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[220px_220px_auto] gap-3">

        {/* ── Hero ── col-span-2 row-span-2 */}
        <div className="lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 min-h-[260px] lg:min-h-0">
          {/* Soft radial glow top-right */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-sky-500/4 blur-2xl pointer-events-none" />
          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Gaming journal</p>
              <h1 className="text-6xl font-bold tracking-tight text-white leading-none mb-4">Joourney</h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                Connect Steam, log every session, and build a personal record of how each game felt.
              </p>
            </div>
            <div className="mt-8">
              <a
                href="/api/auth/steam-login"
                className="inline-flex items-center gap-3 rounded-xl bg-[#1b2838] border border-[#2a475e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a475e] hover:border-[#4c89a5] transition-all duration-150 shadow-md shadow-black/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 233 233" fill="currentColor">
                  <path d="M116.5 0C52.1 0 0 52.1 0 116.5c0 56.3 40 103.5 93.5 114.2l30.7-73.5c-1.2.1-2.4.1-3.6.1-28.4 0-51.5-23.1-51.5-51.5s23.1-51.5 51.5-51.5 51.5 23.1 51.5 51.5c0 24.4-17 44.9-39.8 50.2l-25.7 61.6c.9.1 1.8.1 2.6.1 35.6 0 67.1-15.8 88.6-40.8-19.9-9.3-33.8-29.4-33.8-52.8 0-32.1 26-58.1 58.1-58.1.9 0 1.8 0 2.7.1C211.4 47.3 167.9 0 116.5 0zm4.2 95.3c-18.6 0-33.7 15.1-33.7 33.7s15.1 33.7 33.7 33.7 33.7-15.1 33.7-33.7-15.1-33.7-33.7-33.7z"/>
                </svg>
                Sign in with Steam
              </a>
              <p className="text-xs text-slate-600 mt-3">Free. No account needed beyond Steam.</p>
            </div>
          </div>
        </div>

        {/* ── Journal entry mock ── */}
        <div className="col-span-1 rounded-2xl border border-slate-700/80 bg-slate-900 p-5 flex flex-col gap-3 overflow-hidden">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Journal</p>
          <div className="flex items-center gap-2.5">
            <img
              src="https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_sm_120.jpg"
              alt="Elden Ring"
              className="h-8 w-14 rounded object-cover flex-shrink-0 bg-slate-700"
            />
            <div>
              <p className="text-[13px] font-medium text-slate-100">Elden Ring</p>
              <p className="text-[11px] text-slate-500">Yesterday · 2h 15m</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed flex-1 italic">
            &ldquo;Finally beat Malenia after 40 attempts. The second phase is genuinely one of the best encounters I&apos;ve experienced — punishing but completely fair.&rdquo;
          </p>
          <div className="flex gap-1 flex-wrap">
            {["soulslike", "boss fight", "platinum"].map((t) => (
              <span key={t} className="rounded px-1.5 py-0.5 text-[10px] bg-slate-700/60 text-slate-400">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Library grid ── */}
        <div className="col-span-1 rounded-2xl border border-slate-700/80 bg-slate-900 p-5 flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Library</p>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {COVER_APP_IDS.map((appId) => (
              <img
                key={appId}
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_sm_120.jpg`}
                alt=""
                aria-hidden
                className="w-full rounded object-cover bg-slate-700"
                style={{ aspectRatio: "8/3" }}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-600">Full Steam library synced automatically</p>
        </div>

        {/* ── Status breakdown ── */}
        <div className="col-span-1 rounded-2xl border border-slate-700/80 bg-slate-900 p-5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Status</p>
          <div className="space-y-2.5">
            {[
              { dot: "bg-emerald-500", label: "Playing",      n: 4  },
              { dot: "bg-sky-500",     label: "Completed",    n: 47 },
              { dot: "bg-violet-500",  label: "Replaying",    n: 2  },
              { dot: "bg-rose-500",    label: "Abandoned",    n: 8  },
              { dot: "bg-amber-500",   label: "Want to Play", n: 23 },
            ].map(({ dot, label, n }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-xs text-slate-300 flex-1">{label}</span>
                <span className="text-xs tabular-nums text-slate-600">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tags / organize ── col-span-2 */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/80 bg-slate-900 p-5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Organize your way</p>
          <div className="flex flex-wrap gap-1.5">
            {["soulslike", "open world", "co-op", "indie", "rpg", "roguelite", "fps", "strategy", "horror", "metroidvania", "narrative", "puzzle"].map((tag) => (
              <span key={tag} className="rounded-md px-2.5 py-1 text-xs bg-slate-700/50 text-slate-300 border border-slate-600/40">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Custom tags, lists, and filters — built around how you actually play.</p>
        </div>

      </div>
    </div>
  );
}
