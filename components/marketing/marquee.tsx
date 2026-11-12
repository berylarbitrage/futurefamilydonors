import { Asterisk } from "lucide-react";

/**
 * Ticker strip of short facts. Scrolls only when the visitor allows motion
 * (see .marquee-track in globals.css); otherwise it's a static, wrapping row.
 * The duplicate copy (for a seamless loop) is hidden from assistive tech.
 */
export function Marquee({ items, label }: { items: readonly string[]; label: string }) {
  const row = (dup: boolean) =>
    items.map((t) => (
      <li
        key={`${dup ? "d" : "o"}-${t}`}
        {...(dup ? { "data-dup": "", "aria-hidden": true } : {})}
        className="flex shrink-0 items-center gap-3 px-4 text-base font-extrabold tracking-tight whitespace-nowrap uppercase md:text-lg"
      >
        <Asterisk className="size-5 shrink-0" strokeWidth={3} aria-hidden />
        {t}
      </li>
    ));
  return (
    <section
      aria-label={label}
      className="marquee bg-sun border-ink overflow-hidden border-y-3 py-3.5"
    >
      <ul className="marquee-track">
        {row(false)}
        {row(true)}
      </ul>
    </section>
  );
}
