/**
 * Future Family Donors mark: three chunky overlapping circles — two "parents"
 * (yellow, coral) and a small mint "new arrival" — outlined in thick ink, the
 * same shapes as the hero art.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      {title && <title>{title}</title>}
      <circle cx="17" cy="19" r="12" fill="#FFDE59" stroke="#111" strokeWidth="3" />
      <circle cx="31" cy="19" r="12" fill="#FF7A59" stroke="#111" strokeWidth="3" />
      <circle cx="24" cy="35" r="8" fill="#7EE8C4" stroke="#111" strokeWidth="3" />
    </svg>
  );
}
