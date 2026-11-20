import { cookies } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteTranslator } from "@/components/layout/language";
import { currentLanguage, SOURCE_LANGUAGE } from "@/lib/i18n/languages";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // A visitor who picked another language: keep the page hidden for a moment
  // while it's translated, so they don't see English flash first (CSS reveals
  // it after 3 s at the latest).
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const translating = currentLanguage(cookieHeader) !== SOURCE_LANGUAGE;
  return (
    <>
      <a
        href="#main"
        className="focus:bg-card sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:p-2"
      >
        Skip to content
      </a>
      <SiteTranslator />
      <div id="site-content" data-translating={translating ? "" : undefined}>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </div>
    </>
  );
}
