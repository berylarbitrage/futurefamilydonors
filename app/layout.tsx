import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { SITE, siteUrl } from "@/config/site";
import { CookieBanner } from "@/components/analytics/cookie-banner";
import { Analytics } from "@/components/analytics/analytics";

const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.brand} | Egg & Sperm Donation`,
    template: `%s | ${SITE.brand}`,
  },
  description:
    "You could make someone a parent. Become an egg or sperm donor: paid for your time, medical costs covered, your own coordinator. U.S. and international donors welcome.",
  openGraph: {
    type: "website",
    siteName: SITE.brand,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#C8B8FF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={rubik.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
