import { useId } from "react";

const CORAL = "#FF5A3C";
const SUN = "#FFC53D";
const WHITE = "#FFFFFF";

/** Shared orbit rings + slowly rotating "planets". Centred at (240, 220). */
function Orbits({ dots = true }: { dots?: boolean }) {
  return (
    <>
      <circle cx="240" cy="220" r="206" stroke={WHITE} strokeOpacity="0.1" strokeWidth="1.5" />
      <circle
        cx="240"
        cy="220"
        r="168"
        stroke={WHITE}
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeDasharray="2 8"
      />
      {dots && (
        <g className="animate-orbit" style={{ transformOrigin: "240px 220px" }}>
          <circle cx="240" cy="52" r="7" fill={SUN} />
          <circle cx="385.5" cy="304" r="5" fill={WHITE} />
          <circle cx="94.5" cy="304" r="4" fill={CORAL} />
        </g>
      )}
    </>
  );
}

/** A small constellation: dots joined by thin lines. */
function Constellation({
  points,
  x = 0,
  y = 0,
}: {
  points: [number, number][];
  x?: number;
  y?: number;
}) {
  const d = points.map(([px, py], i) => `${i ? "L" : "M"}${px + x} ${py + y}`).join(" ");
  return (
    <g>
      <path d={d} stroke={WHITE} strokeOpacity="0.45" strokeWidth="1.5" />
      {points.map(([px, py], i) => (
        <circle
          key={i}
          cx={px + x}
          cy={py + y}
          r={i === points.length - 1 ? 5.5 : 4}
          fill={i === points.length - 1 ? SUN : WHITE}
          className={i === 1 ? "animate-blink" : undefined}
        />
      ))}
    </g>
  );
}

/** Abstract geometric hero illustrations (navy backgrounds). Inline SVG only. */
export function HeroArt({ variant }: { variant: "home" | "egg" | "sperm" }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative mx-auto aspect-[12/11] w-full max-w-[16rem] sm:max-w-md" aria-hidden>
      <svg viewBox="0 0 480 440" className="absolute inset-0 h-full w-full" fill="none">
        <defs>
          <clipPath id={`sun-${id}`}>
            <rect x="0" y="0" width="480" height="330" />
          </clipPath>
        </defs>

        {variant === "home" && (
          <>
            <Orbits />
            {/* rising sun with horizon stripes */}
            <g clipPath={`url(#sun-${id})`}>
              <circle cx="240" cy="300" r="128" fill={CORAL} />
            </g>
            <g fill="#0E1A3A">
              <rect x="100" y="262" width="280" height="6" />
              <rect x="100" y="282" width="280" height="9" />
              <rect x="100" y="306" width="280" height="12" />
            </g>
            <path d="M40 330H440" stroke={WHITE} strokeWidth="3" />
            <path d="M88 352H392" stroke={WHITE} strokeOpacity="0.35" strokeWidth="2" />
            <path d="M136 372H344" stroke={WHITE} strokeOpacity="0.2" strokeWidth="2" />
            {/* family constellation above the horizon */}
            <Constellation
              points={[
                [70, 120],
                [128, 78],
                [196, 112],
                [154, 150],
              ]}
            />
            <circle cx="372" cy="112" r="30" fill={SUN} />
            <rect
              x="356"
              y="196"
              width="34"
              height="34"
              stroke={SUN}
              strokeWidth="3"
              transform="rotate(18 373 213)"
            />
          </>
        )}

        {variant === "egg" && (
          <>
            <Orbits />
            <circle cx="240" cy="220" r="118" stroke={CORAL} strokeWidth="26" />
            <circle cx="240" cy="220" r="72" fill={SUN} />
            <circle cx="240" cy="220" r="24" fill="#0E1A3A" />
            <circle cx="240" cy="220" r="24" stroke={WHITE} strokeWidth="3" />
            <path
              d="M240 20V60M240 380V420M40 220H80M400 220H440"
              stroke={WHITE}
              strokeOpacity="0.5"
              strokeWidth="2"
            />
            <Constellation
              x={300}
              y={300}
              points={[
                [20, 40],
                [70, 10],
                [120, 50],
              ]}
            />
          </>
        )}

        {variant === "sperm" && (
          <>
            <Orbits dots={false} />
            <circle cx="320" cy="170" r="96" fill={CORAL} />
            <circle cx="320" cy="170" r="132" stroke={WHITE} strokeOpacity="0.35" strokeWidth="2" />
            {/* motion trajectories heading toward the circle */}
            <path
              d="M24 420C120 380 150 300 236 250"
              stroke={WHITE}
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M24 380C110 352 150 282 224 226"
              stroke={WHITE}
              strokeOpacity="0.45"
              strokeWidth="3"
            />
            <path
              d="M40 344C120 318 160 250 230 204"
              stroke={SUN}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="236" cy="200" r="11" fill={SUN} />
            <g fill={WHITE}>
              <circle cx="70" cy="334" r="4" />
              <circle cx="122" cy="310" r="4" />
              <circle cx="168" cy="268" r="4" className="animate-blink" />
            </g>
            <rect
              x="60"
              y="80"
              width="40"
              height="40"
              stroke={SUN}
              strokeWidth="3"
              transform="rotate(-12 80 100)"
            />
            <circle cx="150" cy="90" r="6" fill={WHITE} />
          </>
        )}
      </svg>
    </div>
  );
}
