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
  /** Kept for older call sites; every section is light now. */
  tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:py-20", className)}
    >
      {(eyebrow || title || intro) && (
        <div className="mb-10 max-w-3xl md:mb-12">
          {eyebrow && <p className="tag mb-4">{eyebrow}</p>}
          {title && (
            <h2 className="text-[2.1rem] leading-[1.05] font-extrabold tracking-tight md:text-5xl">
              {title}
            </h2>
          )}
          {intro && <div className="mt-4 text-lg font-medium">{intro}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
