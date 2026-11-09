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
    <section className="bg-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 md:grid-cols-2 md:pt-20 md:pb-24">
        <div>
          {eyebrow && (
            <p className="border-border bg-card/70 text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase backdrop-blur">
              <span className="bg-brand size-1.5 rounded-full" />
              {eyebrow}
            </p>
          )}
          <h1 className="text-primary text-[2.6rem] leading-[1.05] font-medium tracking-tight md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg md:text-xl">{subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">{children}</div>
          {footnote && <div className="mt-8">{footnote}</div>}
        </div>
        <HeroArt variant={art} />
      </div>
    </section>
  );
}

/** Italic gradient emphasis for a word or phrase inside a headline. */
export function Em({ children }: { children: React.ReactNode }) {
  return <em className="text-brand-gradient font-serif italic">{children}</em>;
}
