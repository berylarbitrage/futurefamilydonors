import { cn } from "@/lib/utils";

export function Section({
  id,
  eyebrow,
  title,
  intro,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-4 py-14 md:py-20", className)}>
      {(eyebrow || title || intro) && (
        <div className="mb-10 max-w-2xl">
          {eyebrow && (
            <p className="text-accent mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase">
              <span className="bg-brand h-px w-8" aria-hidden />
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="text-primary text-3xl leading-tight font-medium tracking-tight md:text-5xl">
              {title}
            </h2>
          )}
          {intro && <div className="text-muted mt-4 text-lg">{intro}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
