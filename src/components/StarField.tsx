"use client";

// Two unrelated irrationals — frac(√2) for x, frac(√3) for y.
// Using complementary values (e.g. 1/φ and 1/φ²) forces x+y=const and creates streaks.
// √2 and √3 are algebraically independent and produce genuine 2D scatter.
const ALPHA = 0.4142135624; // frac(√2)
const BETA  = 0.7320508076; // frac(√3)

const W = 1400;
const H = 1000;

const SIZES = [1.0, 0.6, 0.8, 1.5, 0.7, 1.2, 1.8, 0.5];
const OPACS = [0.75, 0.40, 0.60, 0.90, 0.50, 0.80, 0.65, 0.45];

const STARS = Array.from({ length: 200 }, (_, i) => ({
  cx: +((i * ALPHA * W) % W).toFixed(1),
  cy: +((i * BETA  * H) % H).toFixed(1),
  r:  SIZES[i % SIZES.length],
  o:  OPACS[i % OPACS.length],
}));

export default function StarField() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {STARS.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.o} />
      ))}
    </svg>
  );
}
