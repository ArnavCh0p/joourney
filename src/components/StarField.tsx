"use client";

// Seeded PRNG (mulberry32) — deterministic, so server and client render identical
// stars (no hydration mismatch). Weyl sequences (frac(√2)/frac(√3)) spread points
// evenly but form a quasi-lattice: the same little constellation repeats shifted
// across the sky. Hashed randomness gives natural clumps and gaps with no repeats.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260610);

const W = 1400;
const H = 1000;

// Cool-white stardust instead of pure white — reads softer against the navy
const STAR_COLOR = "#e7ecf8";

const STARS = Array.from({ length: 240 }, (_, i) => ({
  cx: +(rand() * W).toFixed(1),
  cy: +(rand() * H).toFixed(1),
  // rand*rand skews small — lots of faint pinpricks, occasional bigger star
  r:  +(0.5 + rand() * rand() * 1.6).toFixed(2),
  o:  +(0.35 + rand() * 0.6).toFixed(2),
  // Roughly 1 in 8 stars twinkles on its own; the rest sit in slow-breathing layers
  sparkle: i % 8 === 3,
  layer: i % 3,
  delay: +(rand() * 6).toFixed(2),
  dur:   +(2.8 + rand() * 2.8).toFixed(2),
}));

// A handful of brighter stars with a soft halo
const BRIGHT = Array.from({ length: 7 }, () => ({
  cx: +(rand() * W).toFixed(1),
  cy: +(rand() * H).toFixed(1),
  r:  +(1.5 + rand()).toFixed(2),
}));

const AMBIENT = STARS.filter((s) => !s.sparkle);
const SPARKLE = STARS.filter((s) => s.sparkle);

export default function StarField() {
  return (
    <>
      <style>{`
        /* Slow ambient breathing — whole layers fade as one (cheap) */
        @keyframes star-breathe {
          from { opacity: 0.35; }
          to   { opacity: 0.9; }
        }
        .star-layer-a { animation: star-breathe 7s ease-in-out infinite alternate; }
        .star-layer-b { animation: star-breathe 11s ease-in-out infinite alternate; animation-delay: -6s; }
        /* Individual twinkle — staggered so the sky never pulses in unison */
        @keyframes star-sparkle {
          0%, 100% { opacity: 0.95; }
          50%      { opacity: 0.1; }
        }
        .star-sparkle { animation: star-sparkle 3.5s ease-in-out infinite; }
      `}</style>
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="star-halo" x="-250%" y="-250%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* Ambient stars in three layers: one static, two slow-breathing */}
        {[
          { cls: undefined,      layer: 0 },
          { cls: "star-layer-a", layer: 1 },
          { cls: "star-layer-b", layer: 2 },
        ].map(({ cls, layer }) => (
          <g key={layer} className={cls}>
            {AMBIENT.filter((s) => s.layer === layer).map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={STAR_COLOR} opacity={s.o} />
            ))}
          </g>
        ))}

        {/* Twinkling stars — each on its own staggered cycle */}
        {SPARKLE.map((s, i) => (
          <circle
            key={`sp-${i}`}
            className="star-sparkle"
            cx={s.cx} cy={s.cy} r={Math.max(s.r, 0.9)}
            fill={STAR_COLOR}
            style={{ animationDuration: `${s.dur}s`, animationDelay: `-${s.delay}s` }}
          />
        ))}

        {/* Bright stars — soft blurred halo under a solid core */}
        {BRIGHT.map((s, i) => (
          <g key={`br-${i}`}>
            <circle cx={s.cx} cy={s.cy} r={s.r * 2.6} fill="#aac4f0" opacity={0.35} filter="url(#star-halo)" />
            <circle cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={0.95} />
          </g>
        ))}
      </svg>
    </>
  );
}
