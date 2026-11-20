import { timingSafeEqual } from "node:crypto";
import { errorJson, json } from "@/lib/api";
import { env } from "@/lib/env";
import { runDailyJob } from "@/lib/daily-job";

export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = env("CRON_SECRET");
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * Called once a day by Vercel Cron (see vercel.json). Vercel sends
 * "Authorization: Bearer $CRON_SECRET" when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  if (!env("CRON_SECRET")) return errorJson("CRON_SECRET is not set", 503);
  if (!authorized(req)) return errorJson("Unauthorized", 401);
  return json({ ok: true, ...(await runDailyJob()) });
}
