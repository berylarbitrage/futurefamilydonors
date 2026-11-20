import { describe, expect, it } from "vitest";
import {
  currentLanguage,
  googtransValue,
  LANGUAGES,
  matchBrowserLanguage,
} from "@/lib/i18n/languages";

describe("language menu helpers", () => {
  it("matches browser languages, including Chinese variants", () => {
    expect(matchBrowserLanguage("en-US")).toBeUndefined();
    expect(matchBrowserLanguage("zh-CN")?.code).toBe("zh-CN");
    expect(matchBrowserLanguage("zh-Hant-TW")?.code).toBe("zh-TW");
    expect(matchBrowserLanguage("es-MX")?.code).toBe("es");
    expect(matchBrowserLanguage("fil-PH")?.code).toBe("tl");
    expect(matchBrowserLanguage("xx")).toBeUndefined();
  });

  it("reads and writes Google Translate's cookie value", () => {
    expect(googtransValue("en")).toBeNull();
    expect(googtransValue("es")).toBe("/en/es");
    expect(currentLanguage("a=1; googtrans=/en/zh-CN; b=2")).toBe("zh-CN");
    expect(currentLanguage("googtrans=/en/evil")).toBe("en");
    expect(currentLanguage("")).toBe("en");
  });

  it("has unique language codes", () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
