"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export type TurnstileStatus = "loading" | "ready" | "verified" | "error";

/**
 * Cloudflare Turnstile widget. Renders nothing if no site key is configured.
 * Tokens are single-use: bump `resetSignal` after every submit attempt so a
 * retry gets a fresh token.
 */
export function Turnstile({
  siteKey,
  onToken,
  onStatus,
  resetSignal = 0,
}: {
  siteKey?: string;
  onToken: (t: string) => void;
  onStatus?: (s: TurnstileStatus) => void;
  resetSignal?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const cb = useRef({ onToken, onStatus });
  cb.current = { onToken, onStatus };

  const mount = () => {
    if (!siteKey || !ref.current || !window.turnstile || idRef.current) return;
    try {
      idRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        "refresh-expired": "auto",
        retry: "auto",
        callback: (t: string) => {
          cb.current.onToken(t);
          cb.current.onStatus?.("verified");
        },
        "expired-callback": () => {
          cb.current.onToken("");
          cb.current.onStatus?.("ready");
        },
        "timeout-callback": () => {
          cb.current.onToken("");
          cb.current.onStatus?.("ready");
        },
        "error-callback": () => {
          cb.current.onToken("");
          cb.current.onStatus?.("error");
          return true; // let Turnstile keep retrying in the background
        },
      });
      cb.current.onStatus?.("ready");
    } catch {
      cb.current.onStatus?.("error");
    }
  };

  useEffect(() => {
    if (!siteKey) return;
    cb.current.onStatus?.("loading");
    mount();
    // If the script never loads (blocked network, ad blocker), report an error.
    const timer = setTimeout(() => {
      if (!window.turnstile) cb.current.onStatus?.("error");
    }, 10_000);
    return () => {
      clearTimeout(timer);
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current);
      idRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  // Fresh token after each submit attempt.
  useEffect(() => {
    if (resetSignal && idRef.current && window.turnstile) {
      cb.current.onToken("");
      window.turnstile.reset(idRef.current);
    }
  }, [resetSignal]);

  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={mount}
        onError={() => cb.current.onStatus?.("error")}
      />
      <div ref={ref} />
    </>
  );
}
