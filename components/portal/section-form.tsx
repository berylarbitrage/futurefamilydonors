"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  followUpIssues,
  isFieldVisible,
  sectionFields,
  sectionSchema,
  type FieldDef,
  type FormSectionId,
} from "@/lib/full-app";
import type { DonorType } from "@/config/eligibility";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;
const AUTOSAVE_MS = 1500;
const toNumber = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

/** Drop empty values and hidden follow-ups so a draft passes the lenient schema. */
function clean(values: Values, fields: FieldDef[]): Values {
  const out: Values = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.kind === "multi") v = Array.isArray(v) ? v : v ? [v] : [];
    if (v === "" || v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)))
      continue;
    out[f.name] = v;
  }
  for (const f of fields) if (!isFieldVisible(f, out)) delete out[f.name];
  return out;
}

export function SectionForm({
  section,
  donorType,
  initial,
  readOnly,
  onSaved,
}: {
  section: FormSectionId;
  donorType: DonorType;
  initial: Values;
  readOnly: boolean;
  onSaved: (completed: string[], data: Values, advance: boolean) => void;
}) {
  const fields = sectionFields(section, donorType);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "complete" | "auto" | null>(null);
  const zr = zodResolver(sectionSchema(section, donorType, true)) as unknown as Resolver<Values>;
  // zod skips cross-field checks while other answers are missing; add the
  // follow-up checks ourselves so every missing answer shows at once.
  const resolver: Resolver<Values> = async (values, ctx, opts) => {
    const r = await zr(values, ctx, opts);
    const extra = followUpIssues(fields, clean(values, fields));
    if (!Object.keys(extra).length) return r;
    const errors = { ...r.errors } as Record<string, unknown>;
    for (const [k, message] of Object.entries(extra))
      if (!errors[k]) errors[k] = { type: "custom", message };
    return { values: {}, errors: errors as typeof r.errors };
  };
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    watch,
    formState: { errors },
  } = useForm<Values>({ resolver, defaultValues: initial });

  const values = watch();
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(JSON.stringify(clean(initial, fields)));

  const save = useCallback(
    async (vals: Values, mode: "complete" | "draft" | "auto") => {
      const data = clean(vals, fields);
      const serialized = JSON.stringify(data);
      if (mode === "auto" && serialized === lastSaved.current) return;
      setSaving(mode);
      if (mode !== "auto") setStatus(null);
      let res: Response;
      try {
        res = await fetch("/api/portal/section", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          keepalive: mode === "auto",
          body: JSON.stringify({
            section,
            data,
            complete: mode === "complete",
            autosave: mode === "auto",
          }),
        });
      } catch {
        setSaving(null);
        setStatus("Couldn't save — check your connection");
        return;
      }
      setSaving(null);
      const j = (await res.json().catch(() => ({}))) as {
        completed?: string[];
        error?: string;
        issues?: { path: string; message: string }[];
      };
      if (!res.ok) {
        if (mode !== "auto") j.issues?.forEach((i) => setError(i.path, { message: i.message }));
        setStatus(
          mode === "auto"
            ? "Autosave paused — please check your answers"
            : (j.error ?? "Could not save"),
        );
        return;
      }
      lastSaved.current = serialized;
      dirty.current = false;
      setStatus(
        mode === "complete"
          ? "Section saved"
          : mode === "draft"
            ? "Draft saved"
            : `Saved automatically · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      );
      onSaved(j.completed ?? [], data, mode === "complete");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section, donorType],
  );

  // Autosave: shortly after the applicant stops typing, and when leaving the section.
  useEffect(() => {
    if (readOnly) return;
    const sub = watch(() => {
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(getValues(), "auto"), AUTOSAVE_MS);
    });
    return () => {
      sub.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) void save(getValues(), "auto");
    };
  }, [watch, getValues, save, readOnly]);

  const e = errors as Record<string, { message?: string } | undefined>;
  const visible = clean(values, fields);

  return (
    <form
      onSubmit={handleSubmit((v) => {
        if (timer.current) clearTimeout(timer.current);
        return save(v, "complete");
      })}
      noValidate
      className="space-y-5"
    >
      <fieldset disabled={readOnly} className="space-y-5">
        {fields.map((f) => {
          if (f.showIf && !isFieldVisible(f, { ...values, ...visible })) return null;
          const err = e[f.name]?.message;
          const inv = {
            "aria-invalid": !!err,
            "aria-describedby": err ? `${f.name}-error` : undefined,
          };
          const followUp = !!f.showIf;
          let control: React.ReactNode;
          if (f.kind === "yesno" || f.kind === "multi") {
            const opts = f.kind === "yesno" ? ["Yes", "No"] : f.options!;
            control = (
              <fieldset
                className="space-y-2"
                aria-describedby={err ? `${f.name}-error` : undefined}
              >
                <legend className="text-sm font-bold">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </legend>
                {f.hint && <p className="text-muted text-xs">{f.hint}</p>}
                <div
                  className={cn(
                    "grid gap-2",
                    f.kind === "multi" ? "sm:grid-cols-2" : "grid-cols-2",
                  )}
                >
                  {opts.map((o) => (
                    <label
                      key={o}
                      className="border-ink bg-card has-[:checked]:bg-sun has-[:focus-visible]:outline-ring flex min-h-12 cursor-pointer items-center gap-2 rounded-[10px] border-3 px-3 text-sm font-semibold has-[:checked]:shadow-[3px_3px_0_0_#111] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2"
                    >
                      <input
                        type={f.kind === "yesno" ? "radio" : "checkbox"}
                        value={o}
                        className="accent-[#111]"
                        {...register(f.name)}
                      />
                      {o}
                    </label>
                  ))}
                </div>
                {err && (
                  <p id={`${f.name}-error`} role="alert" className="text-destructive text-sm">
                    {err}
                  </p>
                )}
              </fieldset>
            );
          } else {
            control = (
              <Field id={f.name} label={f.label} required={f.required} error={err} hint={f.hint}>
                {f.kind === "textarea" ? (
                  <Textarea
                    id={f.name}
                    rows={followUp ? 3 : 4}
                    maxLength={f.max}
                    {...inv}
                    {...register(f.name)}
                  />
                ) : f.kind === "select" ? (
                  <NativeSelect id={f.name} defaultValue="" {...inv} {...register(f.name)}>
                    <option value="" disabled>
                      Select one
                    </option>
                    {f.options!.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </NativeSelect>
                ) : f.kind === "number" ? (
                  <Input
                    id={f.name}
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    {...inv}
                    {...register(f.name, { setValueAs: toNumber })}
                  />
                ) : (
                  <Input id={f.name} maxLength={f.max} {...inv} {...register(f.name)} />
                )}
              </Field>
            );
          }
          return followUp ? (
            <div
              key={f.name}
              className="border-ink bg-sun-soft -mt-2 rounded-[12px] border-3 border-dashed p-4"
            >
              {control}
            </div>
          ) : (
            <div key={f.name}>{control}</div>
          );
        })}
      </fieldset>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" size="lg" disabled={saving === "complete" || saving === "draft"}>
            {saving === "complete" ? "Saving…" : "Save & Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving === "complete" || saving === "draft"}
            onClick={() => save(getValues(), "draft")}
          >
            {saving === "draft" ? "Saving…" : "Save Draft"}
          </Button>
          <span role="status" className="text-sm font-medium">
            {saving === "auto" ? "Saving…" : (status ?? "Your answers save automatically")}
          </span>
        </div>
      )}
    </form>
  );
}
