import "server-only";
import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmailResult } from "@/lib/email";
import { env } from "@/lib/env";
import { SITE, siteUrl } from "@/config/site";
import { fillTemplate } from "@/lib/messages/templates";
import CoordinatorMessageEmail from "@/emails/coordinator-message";

export interface MessageTarget {
  id: string;
  email: string;
  first_name: string;
  user_id: string | null;
}

export function templateVars(app: MessageTarget): Record<string, string> {
  return {
    firstName: app.first_name,
    brand: SITE.brand,
    phone: SITE.contactPhone,
    portalUrl: app.user_id ? siteUrl("/portal") : siteUrl("/portal/login"),
  };
}

/** Store an outbound message, email it, and record the delivery result. */
export async function sendCoordinatorMessage(
  db: SupabaseClient,
  app: MessageTarget,
  authorId: string,
  rawSubject: string,
  rawBody: string,
) {
  const vars = templateVars(app);
  const subject = fillTemplate(rawSubject, vars).trim();
  const body = fillTemplate(rawBody, vars).trim();

  const { data: row, error } = await db
    .from("messages")
    .insert({ application_id: app.id, direction: "outbound", subject, body, author_id: authorId })
    .select("id")
    .single();
  if (error || !row) throw error ?? new Error("message insert failed");

  const result = await sendEmailResult({
    to: app.email,
    subject,
    react: createElement(CoordinatorMessageEmail, {
      subject,
      body,
      portalUrl: app.user_id ? siteUrl("/portal") : undefined,
    }),
    replyTo: env("ADMIN_NOTIFY_EMAIL") ?? SITE.contactEmail,
  });
  await db
    .from("messages")
    .update({ email_status: result.ok ? "sent" : "failed", email_error: result.error ?? null })
    .eq("id", row.id);
  return { id: row.id as string, ...result };
}
