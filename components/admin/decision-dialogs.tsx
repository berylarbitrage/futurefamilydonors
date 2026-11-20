"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { DECLINE_TEMPLATES } from "@/lib/messages/decline-templates";
import { DEFAULT_NEXT_STEP_NOTE } from "@/lib/messages/next-step-note";
import { SCREENING_TEMPLATE } from "@/lib/messages/screening-template";
import { fillTemplate } from "@/lib/messages/templates";
import { SITE } from "@/config/site";

type Done = (msg: { ok: boolean; text: string }) => void;

async function post(id: string, payload: unknown) {
  const res = await fetch(`/api/admin/applications/${id}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = (await res.json().catch(() => ({}))) as {
    emailed?: boolean | null;
    emailError?: string;
    error?: string;
  };
  return { res, j };
}

function Modal({
  dialog,
  title,
  children,
}: {
  dialog: React.RefObject<HTMLDialogElement | null>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <dialog
      ref={dialog}
      aria-label={title}
      className="bg-card text-foreground m-auto w-[min(40rem,calc(100vw-2rem))] rounded-2xl p-6 backdrop:bg-black/50"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="font-sans text-xl font-semibold">{title}</h2>
        <button
          type="button"
          aria-label="Close"
          className="text-muted"
          onClick={() => dialog.current?.close()}
        >
          <X className="size-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** "Move to next step": email a one-time "create your password" link. */
export function NextStepButton({
  id,
  name,
  email,
  label = "Move to next step",
  size = "sm",
  onDone,
}: {
  id: string;
  name: string;
  email: string;
  label?: string;
  size?: "sm" | "default";
  onDone?: Done;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState(DEFAULT_NEXT_STEP_NOTE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    const { res, j } = await post(id, { decision: "next_step", note: note.trim() || undefined });
    setBusy(false);
    if (!res.ok) return setError(j.error ?? "Could not save. Please try again.");
    dialog.current?.close();
    setNote(DEFAULT_NEXT_STEP_NOTE);
    onDone?.(
      j.emailed
        ? { ok: true, text: `Registration link sent to ${email}.` }
        : {
            ok: false,
            text: `Moved to next step, but the email failed${j.emailError ? `: ${j.emailError}` : ""}. Check /setup-check.`,
          },
    );
    router.refresh();
  };

  return (
    <>
      <Button size={size} onClick={() => dialog.current?.showModal()}>
        <Send /> {label}
      </Button>
      <Modal dialog={dialog} title={`Move ${name} to the next step`}>
        <p className="text-muted text-sm">
          {name} will get an email at <strong>{email}</strong> with a one-time link (valid 14 days)
          to <strong>create a password</strong>, then continue with the full application. The status
          changes to <em>Full app pending</em>.
        </p>
        <label htmlFor={`note-${id}`} className="mt-4 mb-1 block text-sm font-medium">
          Personal note (added to the email — edit or clear it as you like)
        </label>
        <Textarea
          id={`note-${id}`}
          rows={6}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. We loved reading about your volunteering — looking forward to speaking with you!"
        />
        {error && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {error}
          </p>
        )}
        {note !== DEFAULT_NEXT_STEP_NOTE && (
          <button
            type="button"
            className="text-primary mt-1 text-xs font-semibold underline"
            onClick={() => setNote(DEFAULT_NEXT_STEP_NOTE)}
          >
            Restore the standard note
          </button>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button size="sm" onClick={send} disabled={busy}>
            <Send /> {busy ? "Sending…" : "Send registration link"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** "Decline": choose a template, edit the letter, optionally don't send it. */
export function DeclineButton({
  id,
  name,
  firstName,
  email,
  label = "Decline",
  size = "sm",
  onDone,
}: {
  id: string;
  name: string;
  firstName: string;
  email: string;
  label?: string;
  size?: "sm" | "default";
  onDone?: Done;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const vars = { firstName, brand: SITE.brand };
  const first = DECLINE_TEMPLATES[0]!;
  const [templateId, setTemplateId] = useState(first.id);
  const [subject, setSubject] = useState(fillTemplate(first.subject, vars));
  const [body, setBody] = useState(fillTemplate(first.body, vars));
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (tid: string) => {
    const t = DECLINE_TEMPLATES.find((x) => x.id === tid) ?? first;
    setTemplateId(t.id);
    setSubject(fillTemplate(t.subject, vars));
    setBody(fillTemplate(t.body, vars));
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    const { res, j } = await post(id, { decision: "decline", subject, body, sendEmail });
    setBusy(false);
    if (!res.ok) return setError(j.error ?? "Could not save. Please try again.");
    dialog.current?.close();
    onDone?.(
      j.emailed === null
        ? { ok: true, text: `${name} marked as declined (no email sent).` }
        : j.emailed
          ? { ok: true, text: `Declined. Letter sent to ${email}.` }
          : {
              ok: false,
              text: `Declined, but the letter failed to send${j.emailError ? `: ${j.emailError}` : ""}.`,
            },
    );
    router.refresh();
  };

  return (
    <>
      <Button size={size} variant="outline" onClick={() => dialog.current?.showModal()}>
        <X /> {label}
      </Button>
      <Modal dialog={dialog} title={`Decline ${name}`}>
        <div className="space-y-3">
          <div>
            <label htmlFor={`dt-${id}`} className="mb-1 block text-sm font-medium">
              Letter template
            </label>
            <NativeSelect id={`dt-${id}`} value={templateId} onChange={(e) => pick(e.target.value)}>
              {DECLINE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Send this letter to {email}
          </label>
          <fieldset disabled={!sendEmail} className="space-y-3 disabled:opacity-50">
            <div>
              <label htmlFor={`ds-${id}`} className="mb-1 block text-sm font-medium">
                Subject
              </label>
              <Input
                id={`ds-${id}`}
                value={subject}
                maxLength={150}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`db-${id}`} className="mb-1 block text-sm font-medium">
                Letter
              </label>
              <Textarea
                id={`db-${id}`}
                rows={10}
                maxLength={5000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </fieldset>
          <p className="text-muted text-xs">
            Keep it kind and general — please don&apos;t mention medical details in an email.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" onClick={send} disabled={busy}>
            {busy ? "Saving…" : sendEmail ? "Decline & send letter" : "Mark as declined"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** "Approve for screening": edit the message to the applicant, then approve. */
export function ScreeningButton({
  id,
  name,
  firstName,
  email,
  size = "sm",
  onDone,
}: {
  id: string;
  name: string;
  firstName: string;
  email: string;
  size?: "sm" | "default";
  onDone?: Done;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const vars = { firstName, brand: SITE.brand };
  const [subject, setSubject] = useState(fillTemplate(SCREENING_TEMPLATE.subject, vars));
  const [body, setBody] = useState(fillTemplate(SCREENING_TEMPLATE.body, vars));
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    const { res, j } = await post(id, { decision: "screening", subject, body, sendEmail });
    setBusy(false);
    if (!res.ok) return setError(j.error ?? "Could not save. Please try again.");
    dialog.current?.close();
    onDone?.(
      j.emailed === null
        ? { ok: true, text: `${name} approved for screening (no message sent).` }
        : j.emailed
          ? {
              ok: true,
              text: `Approved for screening. Message sent to ${email} (copy to your team inbox).`,
            }
          : {
              ok: false,
              text: `Approved, but the message failed to send${j.emailError ? `: ${j.emailError}` : ""}.`,
            },
    );
    router.refresh();
  };

  return (
    <>
      <Button size={size} onClick={() => dialog.current?.showModal()}>
        <Check /> Approve for screening
      </Button>
      <Modal dialog={dialog} title={`Approve ${name} for screening`}>
        <div className="space-y-3">
          <p className="text-muted text-sm">
            The status changes to <em>Screening</em>. The message below is emailed to {name}, shown
            in their portal and in Messages here, and a copy goes to your team inbox.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Send this message to {email}
          </label>
          <fieldset disabled={!sendEmail} className="space-y-3 disabled:opacity-50">
            <div>
              <label htmlFor={`ss-${id}`} className="mb-1 block text-sm font-medium">
                Subject
              </label>
              <Input
                id={`ss-${id}`}
                value={subject}
                maxLength={150}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`sb-${id}`} className="mb-1 block text-sm font-medium">
                Message
              </label>
              <Textarea
                id={`sb-${id}`}
                rows={12}
                maxLength={5000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </fieldset>
        </div>
        {error && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button size="sm" onClick={send} disabled={busy}>
            <Check /> {busy ? "Saving…" : sendEmail ? "Approve & send message" : "Approve"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
