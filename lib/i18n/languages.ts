/**
 * Languages offered by the site's "Language" menu (machine translation by
 * Google Translate, applied in the visitor's browser). The site is written in
 * English; codes are Google Translate language codes.
 */
export interface Language {
  code: string;
  /** Name in its own language, so people can find it. */
  name: string;
  /** English name (for search / screen readers). */
  english: string;
}

export const SOURCE_LANGUAGE = "en";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", english: "English" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "zh-CN", name: "中文（简体）", english: "Chinese (Simplified)" },
  { code: "zh-TW", name: "中文（繁體）", english: "Chinese (Traditional)" },
  { code: "vi", name: "Tiếng Việt", english: "Vietnamese" },
  { code: "ko", name: "한국어", english: "Korean" },
  { code: "ja", name: "日本語", english: "Japanese" },
  { code: "tl", name: "Tagalog", english: "Filipino" },
  { code: "fr", name: "Français", english: "French" },
  { code: "pt", name: "Português", english: "Portuguese" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "it", name: "Italiano", english: "Italian" },
  { code: "ru", name: "Русский", english: "Russian" },
  { code: "uk", name: "Українська", english: "Ukrainian" },
  { code: "pl", name: "Polski", english: "Polish" },
  { code: "ar", name: "العربية", english: "Arabic" },
  { code: "fa", name: "فارسی", english: "Persian" },
  { code: "he", name: "עברית", english: "Hebrew" },
  { code: "tr", name: "Türkçe", english: "Turkish" },
  { code: "hi", name: "हिन्दी", english: "Hindi" },
  { code: "bn", name: "বাংলা", english: "Bengali" },
  { code: "ur", name: "اردو", english: "Urdu" },
  { code: "pa", name: "ਪੰਜਾਬੀ", english: "Punjabi" },
  { code: "gu", name: "ગુજરાતી", english: "Gujarati" },
  { code: "ta", name: "தமிழ்", english: "Tamil" },
  { code: "te", name: "తెలుగు", english: "Telugu" },
  { code: "th", name: "ไทย", english: "Thai" },
  { code: "id", name: "Bahasa Indonesia", english: "Indonesian" },
  { code: "ms", name: "Bahasa Melayu", english: "Malay" },
  { code: "km", name: "ខ្មែរ", english: "Khmer" },
  { code: "lo", name: "ລາວ", english: "Lao" },
  { code: "my", name: "မြန်မာ", english: "Burmese" },
  { code: "ne", name: "नेपाली", english: "Nepali" },
  { code: "hmn", name: "Hmoob", english: "Hmong" },
  { code: "ht", name: "Kreyòl ayisyen", english: "Haitian Creole" },
  { code: "sw", name: "Kiswahili", english: "Swahili" },
  { code: "am", name: "አማርኛ", english: "Amharic" },
  { code: "so", name: "Soomaali", english: "Somali" },
  { code: "yo", name: "Yorùbá", english: "Yoruba" },
  { code: "nl", name: "Nederlands", english: "Dutch" },
  { code: "el", name: "Ελληνικά", english: "Greek" },
  { code: "ro", name: "Română", english: "Romanian" },
  { code: "hu", name: "Magyar", english: "Hungarian" },
  { code: "cs", name: "Čeština", english: "Czech" },
  { code: "sv", name: "Svenska", english: "Swedish" },
];

export const languageByCode = (code: string) => LANGUAGES.find((l) => l.code === code);

/**
 * Best match for a browser language tag ("zh-Hant-TW", "es-MX", "pt-BR"), or
 * undefined for English / unsupported languages.
 */
export function matchBrowserLanguage(tag: string | undefined | null): Language | undefined {
  if (!tag) return undefined;
  const t = tag.toLowerCase();
  if (t.startsWith("en")) return undefined;
  if (t.startsWith("zh")) {
    const traditional = /hant|tw|hk|mo/.test(t);
    return languageByCode(traditional ? "zh-TW" : "zh-CN");
  }
  if (t.startsWith("fil")) return languageByCode("tl");
  if (t.startsWith("iw")) return languageByCode("he");
  const base = t.split("-")[0]!;
  return LANGUAGES.find((l) => l.code.toLowerCase() === base);
}

/** Value of Google Translate's `googtrans` cookie ("/en/es"), or null. */
export const googtransValue = (code: string) =>
  code === SOURCE_LANGUAGE ? null : `/${SOURCE_LANGUAGE}/${code}`;

/** Read the chosen language from a cookie string. */
export function currentLanguage(cookie: string): string {
  const m = /(?:^|;\s*)googtrans=\/[^/;]*\/([^;]+)/.exec(cookie);
  const code = m ? decodeURIComponent(m[1]!) : SOURCE_LANGUAGE;
  return languageByCode(code) ? code : SOURCE_LANGUAGE;
}
