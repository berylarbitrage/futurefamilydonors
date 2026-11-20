"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { referSchema, type ReferInput } from "@/lib/schemas/refer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Honeypot } from "@/components/forms/honeypot";
import { EmailVerification } from "@/components/forms/email-verification";

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex gap-2">
        <Input readOnly value={url} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="shrink-0"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

export function ReferForm() {
  const [links, setLinks] = useState<{ link: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailProof, setEmailProof] = useState<string | null>(null);
  const [needsCode, setNeedsCode] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReferInput>({ resolver: zodResolver(referSchema) });
  const email = watch("email") ?? "";

  const onSubmit = async (data: ReferInput) => {
    setServerError(null);
    if (!emailProof) return setNeedsCode(true);
    const res = await fetch("/api/refer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, emailProof }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      links?: { link: string };
      error?: string;
    };
    if (res.ok && j.links) setLinks(j.links);
    else setServerError(j.error ?? "Something went wrong. Please try again.");
  };

  if (links) {
    return (
      <div
        className="bg-sun border-ink space-y-5 rounded-[16px] border-3 p-6 shadow-[6px_6px_0_0_#111]"
        role="status"
      >
        <p className="text-lg font-extrabold">Your referral link is ready!</p>
        <p className="text-muted text-sm">
          Share it with anyone who might want to be an egg or sperm donor — they choose on our site.
          We&apos;ll remember the referral for 30 days after they click it.
        </p>
        <CopyRow label="Your referral link" url={links.link} />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="border-ink relative space-y-5 rounded-[16px] border-3 bg-white p-6 shadow-[6px_6px_0_0_#111]"
    >
      <Honeypot {...register("website")} />
      <Field id="name" label="Your name" required error={errors.name?.message}>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field
        id="email"
        label="Your email"
        required
        error={errors.email?.message}
        hint="We'll use this to contact you about your bonus."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      <EmailVerification
        email={email}
        purpose="refer"
        proof={emailProof}
        onProof={(p) => {
          setEmailProof(p);
          if (p) setNeedsCode(false);
        }}
        error={needsCode ? "Please verify your email to get your link." : undefined}
      />
      {serverError && (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Creating…" : "Get My Referral Link"}
      </Button>
    </form>
  );
}
