/**
 * Future Family Donors mark: a coral sun rising on a horizon, wrapped by an
 * orbit arc carrying three "family" dots — two parents and a new arrival in
 * yellow. Line parts use `currentColor` so the mark works on light and navy.
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
      {/* rising sun */}
      <path d="M11 37a13 13 0 0 1 26 0Z" fill="#FF5A3C" />
      {/* orbit arc */}
      <path
        d="M3 37a21 21 0 0 1 42 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
      {/* horizon */}
      <path d="M3 43h42" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      {/* family on the orbit */}
      <circle cx="9.2" cy="22.2" r="3.6" fill="currentColor" />
      <circle cx="38.8" cy="22.2" r="3.6" fill="currentColor" />
      <circle cx="24" cy="16" r="4.6" fill="#FFC53D" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
