import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE, siteUrl } from "@/config/site";
import { CookieBanner } from "@/components/analytics/cookie-banner";
import { Analytics } from "@/components/analytics/analytics";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.brand} | Egg & Sperm Donation`,
    template: `%s | ${SITE.brand}`,
  },
  description:
    "Become an egg or sperm donor and get matched with a family. Compensation for your time, medical costs covered, a dedicated coordinator — U.S. and international donors welcome.",
  openGraph: {
    type: "website",
    siteName: SITE.brand,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0E1A3A",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
