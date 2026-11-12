/**
 * Future Family Donors mark (F13): a mint egg drawn as a planet with an ink
 * orbit ring, and a small coral sperm heading in from the bottom-left —
 * thick ink outlines throughout.
 *
 * `LogoMarkShapes` is the raw geometry (in the mark's own -6 16 116 104 space)
 * so other art can reuse it; `strokeScale` thickens or thins every outline.
 */
export const LOGO_MARK_VIEWBOX = "-6 16 116 104";

export function LogoMarkShapes({ strokeScale = 1 }: { strokeScale?: number }) {
  const s = strokeScale;
  return (
    <>
      <ellipse
        cx="52"
        cy="58"
        rx="46"
        ry="16"
        fill="none"
        stroke="#111"
        strokeWidth={3.5 * s}
        transform="rotate(-18 52 58)"
      />
      <circle cx="52" cy="58" r="24" fill="#7EE8C4" stroke="#111" strokeWidth={4 * s} />
      <circle cx="52" cy="58" r="12" fill="#D8FFF1" />
      <g transform="translate(26 92) rotate(-45) scale(0.9)">
        <path
          d="M-6 0 C -11 -6, -16 6, -22 0 S -33 -6, -40 0"
          fill="none"
          stroke="#111"
          strokeWidth={3.2 * s}
          strokeLinecap="round"
        />
        <ellipse cx="0" cy="0" rx="7.5" ry="5.4" fill="#FF7A59" stroke="#111" strokeWidth={2 * s} />
      </g>
    </>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox={LOGO_MARK_VIEWBOX} className={className} aria-hidden fill="none">
      <LogoMarkShapes />
    </svg>
  );
}
