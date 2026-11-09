"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, type Consent } from "@/lib/consent";

/**
 * Private areas never load or report analytics: their URLs can carry
 * applicant names/emails (admin search) or application IDs.
 */
export const PRIVATE_PATH_RE = /^\/(admin|portal|login|auth|setup-check)(\/|$|\?)/;

/** Loads GA4 + Meta Pixel only after the visitor grants consent, and only on public pages. */
export function Analytics() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const pathname = usePathname() ?? "/";
  const isPrivate = PRIVATE_PATH_RE.test(pathname);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  // If GA was loaded on a public page and the visitor navigates client-side
  // into a private area, stop GA from sending anything there.
  useEffect(() => {
    if (!gaId) return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = isPrivate;
  }, [gaId, isPrivate]);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => {
      const value = (e as CustomEvent<Consent>).detail;
      setConsent(value);
      // Revoking consent requires a reload to unload third-party scripts.
      if (value === "denied" && (window.gtag || window.fbq)) window.location.reload();
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (consent !== "granted" || isPrivate) return null;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
