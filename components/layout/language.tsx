"use client";

import { useEffect, useState } from "react";
import { Globe, X } from "lucide-react";
import {
  currentLanguage,
  googtransValue,
  LANGUAGES,
  languageByCode,
  matchBrowserLanguage,
  SOURCE_LANGUAGE,
  type Language,
} from "@/lib/i18n/languages";
import { DomTranslator } from "@/lib/i18n/dom-translator";
import { cn } from "@/lib/utils";

const SUGGEST_DISMISSED = "gbc-lang-suggest-dismissed";

/** Set (or clear, for English) Google Translate's cookie, then reload. */
export function switchLanguage(code: string) {
  const value = googtransValue(code);
  const host = window.location.hostname;
  const domains = ["", `; domain=${host}`, `; domain=.${host.split(".").slice(-2).join(".")}`];
  // Clear every copy (Google may also set it on the parent domain), then set ours.
  for (const d of domains) document.cookie = `googtrans=; path=/${d}; max-age=0`;
  if (value) document.cookie = `googtrans=${value}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

function useCurrentLanguage() {
  const [code, setCode] = useState(SOURCE_LANGUAGE);
  useEffect(() => setCode(currentLanguage(document.cookie)), []);
  return code;
}

/** "🌐 Language" picker for the header. */
export function LanguageMenu({ className, id = "language" }: { className?: string; id?: string }) {
  const code = useCurrentLanguage();
  return (
    <div className={cn("notranslate relative flex items-center", className)} translate="no">
      <Globe className="text-muted pointer-events-none absolute left-2.5 size-4" aria-hidden />
      <label htmlFor={id} className="sr-only">
        Language
      </label>
      <select
        id={id}
        value={code}
        onChange={(e) => switchLanguage(e.target.value)}
        className="border-border bg-card hover:border-primary focus-visible:outline-ring h-9 max-w-36 cursor-pointer appearance-none rounded-full border py-1 pr-3 pl-8 text-sm font-semibold focus-visible:outline-2"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Google Translate fallback (used only when AI translation isn't set up). */
function loadGoogleTranslate() {
  // Google Translate wraps text in <font> tags; keep React from crashing
  // when it later updates or removes those nodes.
  const proto = Node.prototype as Node & { __gbcPatched?: boolean };
  if (!proto.__gbcPatched) {
    proto.__gbcPatched = true;
    const removeChild = proto.removeChild;
    proto.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) return child;
      return removeChild.call(this, child) as T;
    };
    const insertBefore = proto.insertBefore;
    proto.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
      if (ref && ref.parentNode !== this) return node;
      return insertBefore.call(this, node, ref) as T;
    };
  }
  const w = window as unknown as {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (o: object, id: string) => unknown } };
  };
  w.googleTranslateElementInit = () => {
    if (w.google?.translate)
      new w.google.translate.TranslateElement(
        { pageLanguage: SOURCE_LANGUAGE, autoDisplay: false },
        "google_translate_element",
      );
  };
  if (!document.getElementById("google-translate-script")) {
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }
}

/**
 * Translates the page when a language other than English is chosen (AI
 * translation, Google as a fallback), and suggests the visitor's browser
 * language the first time.
 */
export function SiteTranslator() {
  const code = useCurrentLanguage();
  const [suggest, setSuggest] = useState<Language | undefined>();

  // Suggest the browser's language once (never auto-switch without asking).
  useEffect(() => {
    if (currentLanguage(document.cookie) !== SOURCE_LANGUAGE) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(SUGGEST_DISMISSED) === "1";
    } catch {
      /* storage blocked */
    }
    if (!dismissed) setSuggest(matchBrowserLanguage(navigator.language));
  }, []);

  const [engine, setEngine] = useState<"ai" | "google" | null>(null);

  useEffect(() => {
    const reveal = () =>
      document.getElementById("site-content")?.removeAttribute("data-translating");
    if (code === SOURCE_LANGUAGE || !languageByCode(code)) {
      reveal();
      return;
    }
    document.documentElement.lang = code;
    if (["ar", "he", "fa", "ur"].includes(code)) document.documentElement.dir = "rtl";
    // Natural AI translation first; Google Translate if it isn't set up.
    const ai = new DomTranslator(code, reveal);
    let cancelled = false;
    void ai.start().then((ok) => {
      if (cancelled) return;
      if (ok) setEngine("ai");
      else {
        ai.stop();
        setEngine("google");
        loadGoogleTranslate();
      }
    });
    return () => {
      cancelled = true;
      ai.stop();
    };
  }, [code]);

  const dismiss = () => {
    try {
      localStorage.setItem(SUGGEST_DISMISSED, "1");
    } catch {
      /* storage blocked */
    }
    setSuggest(undefined);
  };

  return (
    <>
      <div id="google_translate_element" className="hidden" aria-hidden />
      {code !== SOURCE_LANGUAGE && (
        <p
          className="notranslate bg-primary-soft text-muted px-4 py-1.5 text-center text-xs"
          translate="no"
        >
          {languageByCode(code)?.name}:{" "}
          {engine === "google" ? "machine translation by Google" : "translated by AI"}. The English
          version is the official one.{" "}
          <button
            type="button"
            className="text-primary font-semibold underline"
            onClick={() => switchLanguage(SOURCE_LANGUAGE)}
          >
            Show in English
          </button>
        </p>
      )}
      {suggest && (
        <div
          role="region"
          aria-label="Language suggestion"
          className="notranslate bg-card border-border fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border p-4 shadow-lg"
          translate="no"
        >
          <Globe className="text-primary size-5 shrink-0" aria-hidden />
          <p className="flex-1 text-sm">
            View this website in <strong>{suggest.name}</strong>?
          </p>
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-semibold"
            onClick={() => switchLanguage(suggest.code)}
          >
            {suggest.name}
          </button>
          <button
            type="button"
            className="text-muted hover:bg-muted-bg rounded-full p-1"
            aria-label="No thanks, keep English"
            onClick={dismiss}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
