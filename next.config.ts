import type { NextConfig } from "next";
import { normalizeUrl } from "./lib/url";

const isDev = process.env.NODE_ENV !== "production";
const supabaseHost = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "";
const supabaseWs = supabaseHost.replace(/^http/, "ws");

// Google Translate (only loaded after a visitor picks a language in the Language menu).
const translate = {
  script:
    "https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com",
  style: "https://translate.googleapis.com https://www.gstatic.com",
  img: "https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://fonts.gstatic.com https://www.google.com",
  connect: "https://translate.googleapis.com https://translate-pa.googleapis.com",
};

// Content Security Policy. Third-party origins: GA4, Meta Pixel, Cloudflare Turnstile, Supabase,
// Google Translate.
// 'unsafe-inline' for scripts is required by Next.js inline bootstrapping unless nonces are used.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com ${translate.script}`,
  `style-src 'self' 'unsafe-inline' ${translate.style}`,
  `img-src 'self' data: blob: ${supabaseHost} https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com ${translate.img}`,
  `media-src 'self' blob: ${supabaseHost}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${supabaseHost} ${supabaseWs} https://www.google-analytics.com https://*.google-analytics.com https://www.facebook.com https://challenges.cloudflare.com ${translate.connect}`,
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .join("; ")
  .replace(/\s{2,}/g, " ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private areas: never cache, never index.
      {
        source: "/(admin|portal|api)/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
