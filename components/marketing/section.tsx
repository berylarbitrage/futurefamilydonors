import { cn } from "@/lib/utils";

export function Section({
  id,
  eyebrow,
  title,
  intro,
  className,
  tone = "light",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  /** "dark" when the section sits on a navy band. */
  tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-4 py-16 md:py-24", className)}>
      {(eyebrow || title || intro) && (
        <div className="mb-10 max-w-3xl md:mb-14">
          {eyebrow && (
            <p
              className={cn(
                "mb-4 flex items-center gap-3 text-xs font-bold tracking-[0.24em] uppercase",
                dark ? "text-sun" : "text-accent-strong",
              )}
            >
              <span className={cn("size-2.5", dark ? "bg-sun" : "bg-accent")} aria-hidden />
              {eyebrow}
            </p>
          )}
          {title && (
            <h2
              className={cn(
                "text-[2rem] leading-[1.05] font-bold tracking-tight md:text-5xl",
                dark ? "text-white" : "text-primary",
              )}
            >
              {title}
            </h2>
          )}
          {intro && (
            <div className={cn("mt-5 text-lg", dark ? "text-on-dark-muted" : "text-muted")}>
              {intro}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
