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
    <section className="bg-grain relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-14 md:grid-cols-[1.15fr_0.85fr] md:pt-16 md:pb-20">
        <div className="min-w-0">
          {eyebrow && <p className="tag mb-6">{eyebrow}</p>}
          <h1 className="text-[2.6rem] leading-[1.04] font-extrabold tracking-tight break-words sm:text-6xl lg:text-[4.4rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium md:text-xl">{subtitle}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">{children}</div>
          {footnote && <div className="mt-8">{footnote}</div>}
        </div>
        <HeroArt variant={art} />
      </div>
    </section>
  );
}

/** The headline "sticker word": a white, tilted, bordered box. */
export function Em({ children }: { children: React.ReactNode }) {
  return <em className="em-sticker">{children}</em>;
}
