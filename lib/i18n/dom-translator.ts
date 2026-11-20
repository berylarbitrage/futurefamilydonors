/**
 * In-browser page translation for the Language menu, backed by /api/translate
 * (Claude, cached on the server). It swaps the text of DOM text nodes and a few
 * attributes in place — React keeps working because it only ever sets the
 * same nodes' values again, which we notice and translate.
 *
 * Skipped: <script>/<style>/<code>/form fields, anything inside .notranslate,
 * [translate="no"]. Inside [data-private] texts are translated but never
 * stored on the server (personal messages).
 */

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "SVG"]);
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const BATCH = 80;
const LS_PREFIX = "gbc-tr-v1:";
const LS_MAX_ENTRIES = 3000;

type Applied = { src: string; out: string };

const HAS_LETTER = /\p{L}/u;
const LOOKS_UNTRANSLATABLE = /^(\S+@\S+\.\S+|https?:\/\/\S+|[\d\s.,:;$%+\-–—/()#*·•|]+)$/u;

function translatable(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && t.length <= 1500 && HAS_LETTER.test(t) && !LOOKS_UNTRANSLATABLE.test(t);
}

function skipped(el: Element | null): boolean {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName.toUpperCase())) return true;
  return !!el.closest('.notranslate,[translate="no"],svg');
}

export class DomTranslator {
  private textState = new WeakMap<Text, Applied>();
  private attrState = new WeakMap<Element, Partial<Record<string, Applied>>>();
  private memory = new Map<string, string>();
  /** Personal texts: kept in memory only, never saved in localStorage. */
  private privateKeys = new Set<string>();
  private inflight = new Set<string>();
  private observer: MutationObserver | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(
    private lang: string,
    private onFirstPass: () => void = () => {},
  ) {
    this.loadLocal();
  }

  /** Resolves false when AI translation isn't available (caller falls back). */
  async start(): Promise<boolean> {
    const ok = await this.pass();
    this.onFirstPass();
    if (!ok) return false;
    this.observer = new MutationObserver(() => this.schedule());
    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    return true;
  }

  stop() {
    this.stopped = true;
    this.observer?.disconnect();
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule() {
    if (this.timer || this.stopped) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.pass();
    }, 120);
  }

  /** One scan of the page: apply what we know, fetch what we don't. */
  private async pass(): Promise<boolean> {
    const texts: { node: Text; src: string; priv: boolean }[] = [];
    const attrs: { el: Element; name: string; src: string; priv: boolean }[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const node = n as Text;
      if (skipped(node.parentElement)) continue;
      const state = this.textState.get(node);
      if (state && node.data === state.out) continue; // already ours
      if (!translatable(node.data)) continue;
      const priv = !!node.parentElement?.closest("[data-private]");
      texts.push({ node, src: node.data, priv });
    }
    for (const el of document.body.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))) {
      if (skipped(el)) continue;
      const st = this.attrState.get(el) ?? {};
      for (const name of ATTRS) {
        const v = el.getAttribute(name);
        if (!v || st[name]?.out === v || !translatable(v)) continue;
        attrs.push({ el, name, src: v, priv: !!el.closest("[data-private]") });
      }
    }

    const key = (s: string) => s.trim();
    const wanted = new Map<string, boolean>(); // source -> cacheable
    for (const t of texts) if (!this.memory.has(key(t.src))) wanted.set(key(t.src), !t.priv);
    for (const a of attrs) if (!this.memory.has(key(a.src))) wanted.set(key(a.src), !a.priv);
    for (const s of this.inflight) wanted.delete(s);

    let ok = true;
    if (wanted.size) {
      ok = await this.fetchAll(wanted);
      if (!ok) return false;
    }

    // Apply (keeping the original leading/trailing whitespace).
    for (const { node, src } of texts) {
      const tr = this.memory.get(key(src));
      if (tr === undefined || !node.isConnected) continue;
      const lead = src.match(/^\s*/)![0];
      const trail = src.match(/\s*$/)![0];
      const out = lead + tr + trail;
      this.textState.set(node, { src, out });
      if (node.data !== out) node.data = out;
    }
    for (const { el, name, src } of attrs) {
      const tr = this.memory.get(key(src));
      if (tr === undefined || !el.isConnected) continue;
      const st = this.attrState.get(el) ?? {};
      st[name] = { src, out: tr };
      this.attrState.set(el, st);
      if (el.getAttribute(name) !== tr) el.setAttribute(name, tr);
    }
    return ok;
  }

  private async fetchAll(wanted: Map<string, boolean>): Promise<boolean> {
    const groups: [boolean, string[]][] = [
      [true, [...wanted].filter(([, c]) => c).map(([s]) => s)],
      [false, [...wanted].filter(([, c]) => !c).map(([s]) => s)],
    ];
    const requests: Promise<boolean>[] = [];
    for (const [cache, list] of groups) {
      for (let i = 0; i < list.length; i += BATCH) {
        const chunk = list.slice(i, i + BATCH);
        chunk.forEach((s) => this.inflight.add(s));
        requests.push(
          this.request(chunk, cache).finally(() => chunk.forEach((s) => this.inflight.delete(s))),
        );
      }
    }
    const results = await Promise.all(requests);
    this.saveLocal();
    return results.every(Boolean);
  }

  private async request(texts: string[], cache: boolean): Promise<boolean> {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: this.lang, texts, cache }),
      });
      if (res.status === 503) return false; // not set up: fall back
      if (!res.ok) return true; // temporary problem: keep English for these
      const j = (await res.json()) as { translations?: Record<string, string> };
      for (const [s, t] of Object.entries(j.translations ?? {})) {
        this.memory.set(s, t);
        if (!cache) this.privateKeys.add(s);
      }
      return true;
    } catch {
      return true;
    }
  }

  private loadLocal() {
    try {
      const raw = localStorage.getItem(LS_PREFIX + this.lang);
      if (raw) for (const [s, t] of JSON.parse(raw) as [string, string][]) this.memory.set(s, t);
    } catch {
      /* storage blocked or corrupt */
    }
  }

  private saveLocal() {
    try {
      const entries = [...this.memory]
        .filter(([s]) => !this.privateKeys.has(s))
        .slice(-LS_MAX_ENTRIES);
      localStorage.setItem(LS_PREFIX + this.lang, JSON.stringify(entries));
    } catch {
      /* storage full or blocked */
    }
  }
}
