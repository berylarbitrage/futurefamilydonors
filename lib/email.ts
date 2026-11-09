import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { SITE } from "@/config/site";

let client: Resend | null = null;

export interface SendResult {
  ok: boolean;
  /** Resend's error message (safe to show to admins; never contains the email body). */
  error?: string;
}

/** Like sendEmail, but returns Resend's error message for diagnostics. */
export async function sendEmailResult(opts: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<SendResult> {
  const key = env("RESEND_API_KEY");
  if (!key) {
    log.info("email skipped (RESEND_API_KEY not set)", { subjectLine: opts.subject });
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }
  client ??= new Resend(key);
  const from = emailFrom();
  try {
    const html = await render(opts.react);
    const text = await render(opts.react, { plainText: true });
    const { error } = await client.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html,
      text,
      replyTo: opts.replyTo,
    });
    if (error) {
      log.error("resend send failed", error, { subjectLine: opts.subject, from });
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    log.error("resend send threw", err, { subjectLine: opts.subject });
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send an email via Resend. Without RESEND_API_KEY the send is skipped and
 * only the subject is logged (never the body — it may contain PII).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<boolean> {
  return (await sendEmailResult(opts)).ok;
}

/** "From" header. A bare address gets the brand name as display name. */
export function emailFrom(): string {
  const configured = env("EMAIL_FROM")?.trim();
  if (!configured) return `${SITE.brand} <onboarding@resend.dev>`;
  return configured.includes("<") ? configured : `${SITE.brand} <${configured}>`;
}

/** Domain part of the configured sender, e.g. "goodbeginningsclub.com". */
export function emailFromDomain(): string | null {
  const m = /@([^>\s]+)>?\s*$/.exec(emailFrom());
  return m ? m[1]!.toLowerCase() : null;
}

/**
 * Ask Resend whether the sender's domain is verified. Returns null when the
 * API key can't list domains (e.g. a "sending access" restricted key).
 */
export async function senderDomainStatus(): Promise<{ domain: string; status: string } | null> {
  const key = env("RESEND_API_KEY");
  const domain = emailFromDomain();
  if (!key || !domain) return null;
  client ??= new Resend(key);
  try {
    const { data, error } = await client.domains.list();
    if (error || !data) return null;
    const list = (Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? [])) as {
      name: string;
      status: string;
    }[];
    const match = list.find((d) => domain === d.name || domain.endsWith(`.${d.name}`));
    return { domain, status: match ? match.status : "not_added" };
  } catch {
    return null;
  }
}
