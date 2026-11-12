/**
 * Future Family Donors mark (F11): two sperm — coral and mint — whose tails
 * curve into a heart around a yellow egg, outlined in thick ink.
 *
 * `LogoMarkShapes` is the raw geometry (in the mark's own 6 14 96 86 space) so
 * other art can reuse it; `strokeScale` thickens or thins every outline.
 */
export const LOGO_MARK_VIEWBOX = "6 14 96 86";

export function LogoMarkShapes({ strokeScale = 1 }: { strokeScale?: number }) {
  const s = strokeScale;
  return (
    <>
      <circle cx="52" cy="58" r="14" fill="#FFDE59" stroke="#111" strokeWidth={3.5 * s} />
      <path
        d="M52 92 C 18 70, 16 34, 36 28 C 46 25, 52 32, 52 40"
        fill="none"
        stroke="#111"
        strokeWidth={4 * s}
        strokeLinecap="round"
      />
      <path
        d="M52 92 C 86 70, 88 34, 68 28 C 58 25, 52 32, 52 40"
        fill="none"
        stroke="#111"
        strokeWidth={4 * s}
        strokeLinecap="round"
      />
      <ellipse
        cx="36"
        cy="28"
        rx="8"
        ry="6"
        fill="#FF7A59"
        stroke="#111"
        strokeWidth={3 * s}
        transform="rotate(-20 36 28)"
      />
      <ellipse
        cx="68"
        cy="28"
        rx="8"
        ry="6"
        fill="#7EE8C4"
        stroke="#111"
        strokeWidth={3 * s}
        transform="rotate(20 68 28)"
      />
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
