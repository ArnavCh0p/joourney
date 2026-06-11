// Letterboxd-style landing: backdrop fading into the page, centered headline + CTA,
// poster row, feature tiles, and sample journal entries.

// Vertical "poster" covers — Steam serves 600x900 library art per app.
const POSTER_APP_IDS = [1245620, 1091500, 1086940, 367520, 292030, 271590];

// Backdrop art (Steam library_hero, 3840x1240) — Elden Ring.
const BACKDROP = {
  appId: 1245620,
  credit: "Elden Ring",
};

const FEATURES = [
  {
    color: "text-teal-400",
    text: "Keep your Steam library synced automatically. Every visit, no upkeep.",
    icon: <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />,
  },
  {
    color: "text-sky-400",
    text: "Write a journal entry for any session: notes, screenshots, whatever's worth keeping",
    icon: <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  },
  {
    color: "text-amber-400",
    text: "Rate every game on your shelf and write reviews you'll actually re-read",
    icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  },
  {
    color: "text-emerald-400",
    text: "Track where every game stands: playing, completed, abandoned, or replaying",
    icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></>,
  },
  {
    color: "text-violet-400",
    text: "Compile named lists and tag games on any topic. Your shelf, your rules.",
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  },
  {
    color: "text-rose-400",
    text: "See sessions detected from your playtime and capture a note while it's fresh",
    icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  },
];

const ENTRIES = [
  {
    appId: 367520,
    title: "Hollow Knight",
    meta: "Playing",
    metaClass: "text-teal-400",
    quoteBorder: "border-teal-500/60",
    date: "Jun 2 · 1h 12m",
    rating: 5,
    quote: "What kinda bug am i anyway? a beetle?",
    rotate: "-1.2deg",
    tags: null,
  },
  {
    appId: 304390,
    title: "For Honor",
    meta: "Multiplayer · Active",
    metaClass: "text-violet-400",
    quoteBorder: "border-violet-500/60",
    date: "Jun 4 · 38m",
    rating: 3,
    quote: "I PARRIED THAT I SWEAR I PARRIED THAT",
    rotate: "0.8deg",
    tags: null,
  },
  {
    appId: 281990,
    title: "Stellaris",
    meta: "Playing",
    metaClass: "text-teal-400",
    quoteBorder: "border-teal-500/60",
    date: "May 28 · 4h 02m",
    rating: 4,
    quote: "The year is 2259, the slums have revolted, but I rule with an iron fist, they shall see...",
    rotate: "-0.6deg",
    tags: null,
  },
  {
    appId: 1091500,
    title: "Cyberpunk 2077",
    meta: "Completed",
    metaClass: "text-sky-400",
    quoteBorder: "border-sky-500/60",
    date: "May 22 · 61h",
    rating: 5,
    quote: "I trust this Dexter DeShawn guy, seems like a real straight shooter",
    rotate: "1.1deg",
    tags: null,
  },
  {
    appId: 1245620,
    title: "Elden Ring",
    meta: "Replaying",
    metaClass: "text-violet-400",
    quoteBorder: "border-violet-500/60",
    date: "Jun 4 · 2h 15m",
    rating: 5,
    quote: "MIQUELLA DID WHAT????What is wrong with these demigods bro",
    rotate: "-0.9deg",
    tags: ["soulslike", "boss fight", "platinum"],
  },
  {
    appId: 814380,
    title: "Sekiro: Shadows Die Twice",
    meta: "Playing",
    metaClass: "text-teal-400",
    quoteBorder: "border-teal-500/60",
    date: "Jun 7 · 3h 41m",
    rating: 5,
    quote: "big monke",
    rotate: "0.7deg",
    tags: null,
  },
];

function SectionHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-slate-700/60 pb-1.5 mb-4">
      <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</h2>
      {right && <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{right}</p>}
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <p className="text-[11px] leading-none tracking-[0.06em]" aria-label={`Rated ${n} out of 5`}>
      <span className="text-amber-400">{"★".repeat(n)}</span>
      <span className="text-slate-700">{"★".repeat(5 - n)}</span>
    </p>
  );
}

export default function SignInHero() {
  return (
    <>
      <div className="relative">

        {/* ════════════════════ HERO ════════════════════ */}
        <section className="relative">

          {/* Backdrop — fades out at the bottom and sides, Letterboxd style */}
          <div className="relative -mx-8 -mt-8 h-[380px] sm:h-[460px]">
            <div
              className="absolute inset-0"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 50%, transparent 100%), linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                maskComposite: "intersect",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 50%, transparent 100%), linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                WebkitMaskComposite: "source-in",
              }}
            >
              <img
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${BACKDROP.appId}/library_hero.jpg`}
                alt=""
                aria-hidden
                className="h-full w-full object-cover object-[center_25%]"
              />
              {/* Slight darkening so the headline stays readable over bright art */}
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <p className="absolute top-3 right-2 text-[10px] uppercase tracking-[0.2em] text-slate-400/60 select-none">
              {BACKDROP.credit}
            </p>
          </div>

          {/* Headline + CTA, overlapping the backdrop fade */}
          <div className="relative z-10 -mt-44 sm:-mt-48 text-center">
            <h1 className="text-[1.7rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-[1.25] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
              Every story. Every world.
              <br />
              Every{" "}
              <span aria-label="Joourney">
                J<span aria-hidden className="font-extralight text-emerald-500">∞</span>rney
              </span>
              , written down.
            </h1>

            <div className="mt-8">
              <a
                href="/api/auth/steam-login"
                className="inline-flex items-center gap-2.5 rounded-md bg-[#1d9e75] px-6 py-3 text-[15px] font-bold text-white shadow-lg shadow-black/40 hover:bg-[#23b585] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 233 233" fill="currentColor" className="flex-shrink-0">
                  <path d="M116.5 0C52.1 0 0 52.1 0 116.5c0 56.3 40 103.5 93.5 114.2l30.7-73.5c-1.2.1-2.4.1-3.6.1-28.4 0-51.5-23.1-51.5-51.5s23.1-51.5 51.5-51.5 51.5 23.1 51.5 51.5c0 24.4-17 44.9-39.8 50.2l-25.7 61.6c.9.1 1.8.1 2.6.1 35.6 0 67.1-15.8 88.6-40.8-19.9-9.3-33.8-29.4-33.8-52.8 0-32.1 26-58.1 58.1-58.1.9 0 1.8 0 2.7.1C211.4 47.3 167.9 0 116.5 0zm4.2 95.3c-18.6 0-33.7 15.1-33.7 33.7s15.1 33.7 33.7 33.7 33.7-15.1 33.7-33.7-15.1-33.7-33.7-33.7z"/>
                </svg>
                Get started, it&rsquo;s free
              </a>
              <p className="mt-3 text-[13px] text-slate-400">
                The personal journal for your game library. Sign in with Steam, nothing new to create.
              </p>
            </div>
          </div>

          {/* Poster row */}
          <div className="mt-12 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {POSTER_APP_IDS.map((appId) => (
              <img
                key={appId}
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`}
                alt=""
                aria-hidden
                className="w-full aspect-[2/3] rounded object-cover bg-slate-800 ring-1 ring-slate-700/40 hover:ring-2 hover:ring-[#1d9e75] transition-shadow"
              />
            ))}
          </div>
        </section>

        {/* ════════════════════ FROM THE JOURNAL ════════════════════ */}
        <section className="mt-14">
          <SectionHeader label="From the journal" right="Recent entries · 6 of 84" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5 items-start">
            {ENTRIES.map((e) => (
              <div
                key={e.appId}
                className="relative rounded-lg border border-slate-600/35 bg-slate-950/85 p-[18px] shadow-xl shadow-black/50 backdrop-blur-md"
                style={{ transform: `rotate(${e.rotate})` }}
              >
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 rounded-[2px]"
                  style={{ background: "rgba(203,213,225,0.18)", border: "1px solid rgba(203,213,225,0.24)" }}
                />
                <div className="flex items-center gap-3 mb-2.5">
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${e.appId}/capsule_sm_120.jpg`}
                    alt="" aria-hidden
                    className="h-9 w-16 rounded-[3px] object-cover flex-shrink-0 bg-slate-800"
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-100 leading-tight truncate">{e.title}</p>
                    <p className={`text-[10.5px] mt-0.5 ${e.metaClass}`}>{e.meta}</p>
                  </div>
                  <p className="ml-auto self-start text-[10px] text-slate-500 tabular-nums flex-shrink-0">{e.date}</p>
                </div>
                <div className="mb-2.5">
                  <Stars n={e.rating} />
                </div>
                <div className={`border-l-2 ${e.quoteBorder} pl-3`}>
                  <p className="text-[12.5px] text-slate-300 italic leading-relaxed">&ldquo;{e.quote}&rdquo;</p>
                </div>
                {e.tags && (
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {e.tags.map((t) => (
                      <span key={t} className="text-[9px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════ FEATURES ════════════════════ */}
        <section className="mt-14">
          <SectionHeader label="Joourney lets you…" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {FEATURES.map(({ color, text, icon }) => (
              <div
                key={text}
                className="flex items-start gap-3.5 rounded-md bg-slate-800/60 p-4 hover:bg-slate-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${color}`}
                  aria-hidden="true"
                >
                  {icon}
                </svg>
                <p className="text-[13px] text-slate-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}
