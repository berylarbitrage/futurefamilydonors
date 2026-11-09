import { HeroArt } from "@/components/brand/hero-art";

export function Hero({
  eyebrow,
  title,
  subtitle,
  art,
  children,
  footnote,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  art: "home" | "egg" | "sperm";
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <section className="bg-navy-grid on-dark relative overflow-hidden">
      {/* coral corner block */}
      <span aria-hidden className="bg-accent absolute top-0 right-0 hidden h-3 w-1/3 md:block" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-14 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-24">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-sun mb-6 inline-flex items-center gap-3 text-xs font-bold tracking-[0.24em] uppercase">
              <span className="bg-sun size-2.5" aria-hidden />
              {eyebrow}
            </p>
          )}
          <h1 className="text-[2.5rem] leading-[1.02] font-bold tracking-tight break-words text-white sm:text-6xl lg:text-[4.75rem]">
            {title}
          </h1>
          <p className="text-on-dark-muted mt-6 max-w-xl text-lg md:text-xl">{subtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">{children}</div>
          {footnote && <div className="mt-9">{footnote}</div>}
        </div>
        <HeroArt variant={art} />
      </div>
    </section>
  );
}

/** Emphasis for a word or phrase inside a headline (yellow marker / yellow on navy). */
export function Em({ children }: { children: React.ReactNode }) {
  return <em className="em-mark">{children}</em>;
}
