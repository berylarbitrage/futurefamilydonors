import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb } from "./fake-db";

const db = new FakeDb();
const claudeCalls: { lang: string; texts: string[]; model: string }[] = [];
let failClaude = false;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db,
  PHOTO_BUCKET: "donor-photos",
}));
vi.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    static AuthenticationError = class extends Error {};
    static RateLimitError = class extends Error {};
    beta = {
      messages: {
        parse: async (p: { model: string; messages: { content: string }[] }) => {
          if (failClaude) throw new Error("boom");
          const content = p.messages[0]!.content;
          const lang = /Target language: ([^(]+)/.exec(content)![1]!.trim();
          const texts = JSON.parse(content.slice(content.indexOf("["))) as string[];
          claudeCalls.push({ lang, texts, model: p.model });
          return {
            stop_reason: "end_turn",
            parsed_output: { translations: texts.map((t) => `ES:${t}`) },
          };
        },
      },
    };
  }
  return { default: Anthropic };
});

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ANTHROPIC_API_KEY = "test";

const { translateTexts, MODEL } = await import("@/lib/i18n/translate-server");
const { POST } = await import("@/app/api/translate/route");

let ip = 0;
const call = (body: unknown) =>
  POST(
    new Request("http://x/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.5.${++ip}.1` },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  claudeCalls.length = 0;
  failClaude = false;
  db.tables = { translations: [] };
});

describe("AI translation", () => {
  it("translates with Claude once, then serves from the cache", async () => {
    const first = await translateTexts("es", ["Apply now", "About us", "Apply now"]);
    expect(first).toEqual({ "Apply now": "ES:Apply now", "About us": "ES:About us" });
    expect(claudeCalls).toHaveLength(1);
    expect(claudeCalls[0]).toMatchObject({ lang: "Spanish", model: MODEL });
    expect(db.tables.translations).toHaveLength(2);

    const again = await translateTexts("es", ["Apply now", "About us"]);
    expect(again).toEqual(first);
    expect(claudeCalls).toHaveLength(1); // no new Claude call
  });

  it("never stores personal texts", async () => {
    await translateTexts("es", ["Hi Jane, see you Monday"], { cache: false });
    expect(db.tables.translations).toHaveLength(0);
  });

  it("returns the English text when Claude fails (and caches nothing)", async () => {
    failClaude = true;
    expect(await translateTexts("es", ["Contact"])).toEqual({ Contact: "Contact" });
    expect(db.tables.translations).toHaveLength(0);
  });

  it("splits large pages into several requests", async () => {
    const texts = Array.from({ length: 130 }, (_, i) => `Text ${i}`);
    const out = await translateTexts("zh-CN", texts);
    expect(Object.keys(out)).toHaveLength(130);
    expect(claudeCalls.length).toBe(3);
  });

  it("API validates the language and size", async () => {
    expect((await call({ lang: "en", texts: ["Hi"] })).status).toBe(400);
    expect((await call({ lang: "xx", texts: ["Hi"] })).status).toBe(400);
    const ok = await call({ lang: "es", texts: ["Hello"] });
    expect(await ok.json()).toEqual({ translations: { Hello: "ES:Hello" } });
  });

  it("API says 503 when no API key is set, so the page falls back", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect((await call({ lang: "es", texts: ["Hi"] })).status).toBe(503);
    process.env.ANTHROPIC_API_KEY = "test";
  });
});
