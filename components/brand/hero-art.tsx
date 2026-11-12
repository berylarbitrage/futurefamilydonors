const INK = "#111111";
const SUN = "#FFDE59";
const CORAL = "#FF7A59";
const MINT = "#7EE8C4";
const LAV = "#C8B8FF";
const WHITE = "#FFFFFF";

const S = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const };

function Star({ x, y, r = 22, fill = WHITE }: { x: number; y: number; r?: number; fill?: string }) {
  // 5-point star centred on (x, y).
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} {...S} strokeWidth={4} />;
}

function Sparkle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d={`M${x} ${y - 16 * s}Q${x + 3 * s} ${y - 3 * s} ${x + 16 * s} ${y}Q${x + 3 * s} ${y + 3 * s} ${x} ${y + 16 * s}Q${x - 3 * s} ${y + 3 * s} ${x - 16 * s} ${y}Q${x - 3 * s} ${y - 3 * s} ${x} ${y - 16 * s}Z`}
      fill={SUN}
      {...S}
      strokeWidth={3.5}
    />
  );
}

/** Chunky abstract shapes in a white bordered panel (neo-brutalist). Inline SVG only. */
export function HeroArt({ variant }: { variant: "home" | "egg" | "sperm" }) {
  return (
    <div
      className="border-ink relative mx-auto w-full max-w-[22rem] rounded-2xl border-3 bg-white shadow-[6px_6px_0_0_#111] sm:max-w-md"
      aria-hidden
    >
      <svg viewBox="0 0 440 400" className="block h-auto w-full" fill="none">
        {/* faint dot grid */}
        <g fill={INK} fillOpacity="0.12">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 9 }).map((__, c) => (
              <circle key={`${r}-${c}`} cx={30 + c * 48} cy={28 + r * 48} r="2" />
            )),
          )}
        </g>

        {variant === "home" && (
          <>
            <rect
              x="300"
              y="250"
              width="86"
              height="86"
              rx="10"
              fill={LAV}
              {...S}
              transform="rotate(12 343 293)"
            />
            <circle cx="160" cy="180" r="92" fill={SUN} {...S} />
            <circle cx="268" cy="180" r="92" fill={CORAL} {...S} />
            {/* overlap lens re-drawn so the outlines read clearly */}
            <path d="M214 105.5A92 92 0 0 1 214 254.5A92 92 0 0 1 214 105.5Z" fill={WHITE} {...S} />
            <circle cx="214" cy="292" r="54" fill={MINT} {...S} />
            <g className="animate-wobble">
              <Star x={362} y={70} r={32} />
            </g>
            <path
              d="M40 330c18-22 36 22 54 0s36 22 54 0"
              stroke={INK}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <Sparkle x={66} y={70} />
          </>
        )}

        {variant === "egg" && (
          <>
            <circle cx="340" cy="300" r="56" fill={MINT} {...S} />
            <ellipse cx="200" cy="205" rx="118" ry="148" fill={WHITE} {...S} />
            <ellipse
              cx="200"
              cy="205"
              rx="118"
              ry="148"
              fill={SUN}
              {...S}
              transform="translate(-10 -8)"
            />
            <circle cx="190" cy="215" r="58" fill={CORAL} {...S} />
            <circle cx="172" cy="196" r="14" fill={WHITE} stroke={INK} strokeWidth="4" />
            <g className="animate-wobble">
              <Star x={362} y={84} r={30} />
            </g>
            <Sparkle x={58} y={330} s={1.2} />
            <Sparkle x={380} y={190} s={0.8} />
          </>
        )}

        {variant === "sperm" && (
          <>
            <rect
              x="48"
              y="56"
              width="96"
              height="96"
              rx="12"
              fill={LAV}
              {...S}
              transform="rotate(-10 96 104)"
            />
            <circle cx="300" cy="170" r="96" fill={CORAL} {...S} />
            <circle cx="300" cy="170" r="40" fill={SUN} {...S} />
            {/* chunky wavy path heading into the circle */}
            <path
              d="M36 344c40-40 70 20 110-20s70 20 110-30"
              stroke={INK}
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M36 344c40-40 70 20 110-20s70 20 110-30"
              stroke={MINT}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="262" cy="292" r="22" fill={MINT} {...S} />
            <g className="animate-wobble">
              <Star x={382} y={330} r={28} />
            </g>
            <Sparkle x={196} y={64} />
          </>
        )}
      </svg>
    </div>
  );
}
