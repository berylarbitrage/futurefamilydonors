import { useId } from "react";

/**
 * Good Beginnings Club mark: overlapping lavender and peach circles with a
 * sperm cell swimming into the overlap. Pure SVG so it stays crisp anywhere.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={`lav-${id}`} cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#E4D0F5" />
          <stop offset="55%" stopColor="#B892DD" />
          <stop offset="100%" stopColor="#8A5FC0" />
        </radialGradient>
        <radialGradient id={`pch-${id}`} cx="60%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#FFE9E4" />
          <stop offset="60%" stopColor="#FBC3B4" />
          <stop offset="100%" stopColor="#F2A0A8" />
        </radialGradient>
      </defs>
      {/* peach "heart-like" circle behind */}
      <circle cx="72" cy="44" r="38" fill={`url(#pch-${id})`} opacity="0.95" />
      <circle cx="78" cy="58" r="22" fill="#FFF3F0" opacity="0.45" />
      {/* lavender circle in front */}
      <circle cx="46" cy="54" r="38" fill={`url(#lav-${id})`} opacity="0.92" />
      {/* sperm cell */}
      <path
        d="M30 74 C 40 72, 44 64, 52 62 S 62 58, 64 50"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.95"
      />
      <ellipse cx="67.5" cy="45" rx="5.2" ry="7" transform="rotate(35 67.5 45)" fill="#FFFFFF" />
    </svg>
  );
}
