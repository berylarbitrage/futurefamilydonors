import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { senderDomainStatus } from "@/lib/email";
import { normalizeUrl } from "@/lib/url";
import { PHOTO_BUCKET } from "@/lib/supabase/admin";
import { checkPublishableKey, checkSecretKey } from "@/lib/supabase-key";

export type CheckStatus = "ok" | "warn" | "fail";
export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

function has(name: string) {
  return !!env(name);
}

/**
 * Deployment self-test. Reports only pass/fail and hints — never secret values.
 * `hasAdmin` is used by the page to decide whether the report is public.
 */
export async function runSetupChecks(
  requestHost?: string,
): Promise<{ checks: Check[]; hasAdmin: boolean | null }> {
  const checks: Check[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ id, label, status, detail });

  // ---- Site URL
  const rawSite = env("NEXT_PUBLIC_SITE_URL");
  const siteUrl = normalizeUrl(rawSite);
  if (!rawSite) {
    add(
      "site_url",
      "NEXT_PUBLIC_SITE_URL",
      "fail",
      "Not set. Email sign-in links will point to the wrong address.",
    );
  } else if (!siteUrl) {
    add(
      "site_url",
      "NEXT_PUBLIC_SITE_URL",
      "fail",
      `"${rawSite}" is not a valid URL. Use e.g. https://www.example.com`,
    );
  } else {
    const host = new URL(siteUrl).host;
    if (rawSite.trim().replace(/\/$/, "") !== siteUrl)
      add(
        "site_url_format",
        "NEXT_PUBLIC_SITE_URL format",
        "warn",
        `Value has extra characters; read as ${siteUrl}. Please set it to exactly ${siteUrl}`,
      );
    if (requestHost && host !== requestHost)
      add(
        "site_url",
        "NEXT_PUBLIC_SITE_URL",
        "warn",
        `Set to ${host}, but you are visiting ${requestHost}. Email links will open ${host}.`,
      );
    else add("site_url", "NEXT_PUBLIC_SITE_URL", "ok", siteUrl);
  }

  // ---- Supabase keys
  const rawSbUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const url = normalizeUrl(rawSbUrl);
  if (rawSbUrl && url && rawSbUrl.trim().replace(/\/$/, "") !== url)
    add(
      "sb_url_format",
      "NEXT_PUBLIC_SUPABASE_URL format",
      "warn",
      `Value has extra characters; read as ${url}. Please set it to exactly ${url}`,
    );
  const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  add(
    "sb_url",
    "NEXT_PUBLIC_SUPABASE_URL",
    url ? "ok" : "fail",
    url
      ? url
      : rawSbUrl
        ? `"${rawSbUrl}" is not a valid URL.`
        : "Not set (Supabase → Connect → Project URL).",
  );
  const anonVerdict = checkPublishableKey(anon, url);
  add(
    "sb_anon",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable key)",
    anonVerdict.status,
    anonVerdict.detail,
  );
  const serviceVerdict = checkSecretKey(service, anon, url);
  add(
    "sb_service",
    "SUPABASE_SERVICE_ROLE_KEY (secret key)",
    serviceVerdict.status,
    serviceVerdict.detail,
  );

  let hasAdmin: boolean | null = null;
  if (url && service) {
    const db = createClient(url, service, { auth: { persistSession: false } });

    // Live check: only a real secret key may use the admin API.
    const adminProbe = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
    add(
      "sb_service_works",
      "Secret key accepted by Supabase",
      adminProbe.error ? "fail" : "ok",
      adminProbe.error
        ? `Supabase rejected it as an admin key (${adminProbe.error.message}). Re-copy the secret / service_role key from the same project as the URL.`
        : "Admin access works.",
    );

    const apps = await db.from("applications").select("id", { count: "exact", head: true });
    if (apps.error) {
      const missing = /relation|does not exist|schema cache/i.test(apps.error.message);
      add(
        "db_tables",
        "Database tables (migrations)",
        "fail",
        missing
          ? "Tables not found. Run both files in supabase/migrations/ in the Supabase SQL Editor."
          : `Cannot reach database: ${apps.error.message}. Check the URL and secret key.`,
      );
    } else {
      add(
        "db_tables",
        "Database tables (migrations)",
        "ok",
        `applications table found (${apps.count ?? 0} rows).`,
      );
    }

    const rpc = await db.rpc("user_id_by_email", { p_email: "setup-check@invalid.local" });
    add(
      "db_functions",
      "Database functions",
      rpc.error ? "fail" : "ok",
      rpc.error ? "user_id_by_email() missing — run the first migration file." : "Found.",
    );

    const stats = await db.rpc("admin_stats", { p_week_start: new Date().toISOString() });
    const statsMissing =
      !!stats.error && /could not find|does not exist/i.test(stats.error.message);
    add(
      "db_stats",
      "Admin stats function (2nd migration)",
      statsMissing ? "fail" : "ok",
      statsMissing ? "admin_stats() missing — run the second migration file." : "Found.",
    );

    const msgs = await db.from("messages").select("id", { count: "exact", head: true });
    add(
      "db_messages",
      "Messages table (3rd migration)",
      msgs.error ? "fail" : "ok",
      msgs.error
        ? "messages table missing — run supabase/migrations/20261107000000_messages.sql."
        : "Found.",
    );

    const roles = await db.rpc("is_staff");
    add(
      "db_roles",
      "Staff & catalog roles (4th migration)",
      roles.error ? "fail" : "ok",
      roles.error
        ? "Not installed — run supabase/migrations/20261108000000_roles.sql. Until then only admins can use /admin and invites will fail."
        : "Found.",
    );

    const bucket = await db.storage.getBucket(PHOTO_BUCKET);
    if (bucket.error || !bucket.data)
      add(
        "storage",
        "Photo storage bucket",
        "fail",
        `Bucket "${PHOTO_BUCKET}" not found — run the first migration file.`,
      );
    else if (bucket.data.public)
      add(
        "storage",
        "Photo storage bucket",
        "fail",
        `Bucket "${PHOTO_BUCKET}" is PUBLIC. Make it private in Supabase → Storage.`,
      );
    else add("storage", "Photo storage bucket", "ok", "Private bucket found.");

    const admins = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "owner"]);
    if (!admins.error) {
      hasAdmin = (admins.count ?? 0) > 0;
      add(
        "admin",
        "Admin account",
        hasAdmin ? "ok" : "warn",
        hasAdmin ? `${admins.count} admin(s) incl. owner.` : "No admin yet. See README section 4.",
      );
    }

    const ownerFn = await db.rpc("is_owner");
    if (ownerFn.error) {
      add(
        "owner",
        "Owner / super admin (5th migration)",
        "fail",
        "Not installed — run supabase/migrations/20261109000000_owner.sql.",
      );
    } else {
      const owners = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner");
      const n = owners.count ?? 0;
      add(
        "owner",
        "Owner / super admin",
        n === 1 ? "ok" : "warn",
        n === 1
          ? "Set (only the owner can grant or remove admin access)."
          : "No owner yet. Run the SQL at the top of supabase/migrations/20261109000000_owner.sql with your email.",
      );
    }
  }

  if (url && anon) {
    const pub = createClient(url, anon, { auth: { persistSession: false } });
    const r = await pub.from("applications").select("id", { count: "exact", head: true });
    const badKey = !!r.error && /api key|jwt|unauthorized|invalid/i.test(r.error.message);
    add(
      "sb_anon_valid",
      "Publishable key works",
      badKey ? "fail" : "ok",
      badKey
        ? "Supabase rejected the publishable key. Re-copy it."
        : "Accepted (and RLS hides all rows from anonymous users).",
    );
  }

  // ---- Email
  add(
    "resend",
    "RESEND_API_KEY",
    has("RESEND_API_KEY") ? "ok" : "fail",
    has("RESEND_API_KEY") ? "Set" : "Not set — no emails (including sign-in links) will be sent.",
  );
  add(
    "email_from",
    "EMAIL_FROM",
    has("EMAIL_FROM") ? "ok" : "warn",
    has("EMAIL_FROM")
      ? env("EMAIL_FROM")!
      : "Not set — using Resend test sender, which can ONLY email your own Resend account address. Verify your domain in Resend and set this.",
  );
  if (has("RESEND_API_KEY") && has("EMAIL_FROM")) {
    const st = await senderDomainStatus();
    if (!st) {
      add(
        "resend_domain",
        "Sender domain verified in Resend",
        "warn",
        "Could not check (the API key may be 'sending access' only). Check Resend → Domains manually, or use the test button below.",
      );
    } else if (st.status === "verified") {
      add("resend_domain", "Sender domain verified in Resend", "ok", `${st.domain} is verified.`);
    } else if (st.status === "not_added") {
      add(
        "resend_domain",
        "Sender domain verified in Resend",
        "fail",
        `${st.domain} is not added in Resend → Domains. Emails from ${st.domain} will be rejected. Add it and create the DNS records Resend shows.`,
      );
    } else {
      add(
        "resend_domain",
        "Sender domain verified in Resend",
        "fail",
        `${st.domain} status is "${st.status}". Emails will be rejected until it is verified. Add the DNS records shown in Resend → Domains, then click Verify.`,
      );
    }
  }
  add(
    "admin_email",
    "ADMIN_NOTIFY_EMAIL",
    has("ADMIN_NOTIFY_EMAIL") ? "ok" : "warn",
    has("ADMIN_NOTIFY_EMAIL") ? "Set" : "Not set — you won't be notified of new applications.",
  );

  // ---- Turnstile
  const ts = [has("TURNSTILE_SITE_KEY"), has("TURNSTILE_SECRET_KEY")];
  if (process.env.VERCEL_ENV === "preview")
    add(
      "turnstile_preview",
      "Turnstile on this preview",
      "warn",
      "Skipped on preview deployments (random hostnames). Active in production.",
    );
  add(
    "turnstile",
    "Cloudflare Turnstile",
    ts[0] && ts[1] ? "ok" : ts[0] || ts[1] ? "fail" : "warn",
    ts[0] && ts[1]
      ? `Both keys set. The Turnstile widget's hostname list must include ${requestHost ?? "this site's domain"}.`
      : ts[0] || ts[1]
        ? "Only one key is set — Turnstile is disabled until both are set."
        : "Not set — spam protection is off (honeypot and rate limits still apply).",
  );

  // ---- Analytics
  add(
    "ga",
    "NEXT_PUBLIC_GA_ID",
    has("NEXT_PUBLIC_GA_ID") ? "ok" : "warn",
    has("NEXT_PUBLIC_GA_ID") ? "Set" : "Not set (optional).",
  );
  add(
    "pixel",
    "NEXT_PUBLIC_META_PIXEL_ID",
    has("NEXT_PUBLIC_META_PIXEL_ID") ? "ok" : "warn",
    has("NEXT_PUBLIC_META_PIXEL_ID") ? "Set" : "Not set (optional).",
  );

  return { checks, hasAdmin };
}
