"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  followUpIssues,
  isFieldVisible,
  sanitizeForForm,
  sectionFields,
  sectionSchema,
  visibleGridRows,
  type FieldDef,
  type FormSectionId,
} from "@/lib/full-app";
import type { DonorType } from "@/config/eligibility";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SchoolCombobox } from "@/components/forms/school-combobox";
import { MultiSelect } from "@/components/forms/multi-select";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;
const AUTOSAVE_MS = 1500;
const RETRY_MS = 15_000;
const toNumber = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

/** Keep only filled-in cells; undefined when nothing was filled in. */
function cleanGrid(v: unknown): Values | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Values = {};
  for (const [row, cells] of Object.entries(v as Record<string, Values>)) {
    if (!cells || typeof cells !== "object") continue;
    const kept: Values = {};
    for (const [k, x] of Object.entries(cells)) {
      if (typeof x === "string" && x.trim() !== "") kept[k] = x;
      else if (Array.isArray(x) && x.length) kept[k] = x;
    }
    if (Object.keys(kept).length) out[row] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * A "choose all that apply" answer as a list. react-hook-form reports a
 * checkbox group nobody has ticked as `false` (it registers the first box on
 * its own), which the schema would reject as "expected array, received boolean".
 */
const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];

/** Every checklist answer (also inside grids) as a list, before validation. */
function normalizeLists(values: Values, fields: FieldDef[]): Values {
  const out: Values = { ...values };
  for (const f of fields) {
    if (f.kind === "multi") out[f.name] = asList(values[f.name]);
    else if (f.kind === "grid" && values[f.name] && typeof values[f.name] === "object") {
      const grid: Values = {};
      for (const [row, cells] of Object.entries(values[f.name] as Record<string, Values>)) {
        if (!cells || typeof cells !== "object") continue;
        const next: Values = { ...cells };
        for (const c of f.columns ?? []) if (c.kind === "multi") next[c.key] = asList(cells[c.key]);
        grid[row] = next;
      }
      out[f.name] = grid;
    }
  }
  return out;
}

/** Only the rows of a grid that are on screen (e.g. as many siblings as the applicant has). */
function keepVisibleRows(f: FieldDef, v: unknown, values: Values): unknown {
  if (!f.rowCountFrom || !v || typeof v !== "object") return v;
  const out: Values = {};
  for (const r of visibleGridRows(f, values)) {
    const row = (v as Values)[r.key];
    if (row !== undefined) out[r.key] = row;
  }
  return out;
}

/** Drop empty values and hidden follow-ups so a draft passes the lenient schema. */
function clean(values: Values, fields: FieldDef[]): Values {
  const out: Values = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.kind === "multi") v = asList(v);
    if (f.kind === "grid") v = cleanGrid(keepVisibleRows(f, v, values));
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
  initial: saved,
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
  // Read-only (submitted) shows exactly what was sent; drafts drop answers that are no longer choices.
  const initial = readOnly ? saved : sanitizeForForm(fields, saved);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "complete" | "auto" | null>(null);
  const zr = zodResolver(sectionSchema(section, donorType, true)) as unknown as Resolver<Values>;
  // zod skips cross-field checks while other answers are missing; add the
  // follow-up checks ourselves so every missing answer shows at once.
  const resolver: Resolver<Values> = async (raw, ctx, opts) => {
    let values = normalizeLists(raw, fields);
    for (const f of fields)
      if (f.rowCountFrom && values[f.name])
        values = { ...values, [f.name]: keepVisibleRows(f, values[f.name], values) };
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
    setValue,
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
      if (res.status === 429) {
        // Saving too often: try the autosave again shortly; ask for a short wait otherwise.
        if (mode === "auto") {
          setStatus("Saving shortly…");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => void save(getValues(), "auto"), RETRY_MS);
        } else {
          setStatus("Saving a lot at once — please wait a few seconds and press again.");
        }
        return;
      }
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
  const cellList = (path: string): string[] => {
    let cur: unknown = values;
    for (const part of path.split(".")) cur = (cur as Record<string, unknown> | undefined)?.[part];
    return Array.isArray(cur) ? (cur as string[]) : typeof cur === "string" && cur ? [cur] : [];
  };
  const cellError = (path: string): string | undefined => {
    let cur: unknown = errors;
    for (const part of path.split(".")) cur = (cur as Record<string, unknown> | undefined)?.[part];
    return (cur as { message?: string } | undefined)?.message;
  };
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
          if (f.kind === "multi" && f.options!.length > 15) {
            // Long "choose all that apply" lists: a compact dropdown checklist.
            control = (
              <Field id={f.name} label={f.label} required={f.required} error={err} hint={f.hint}>
                <MultiSelect
                  id={f.name}
                  options={f.options!}
                  selected={cellList(f.name)}
                  register={register(f.name)}
                  invalid={!!err}
                  describedBy={err ? `${f.name}-error` : undefined}
                />
              </Field>
            );
          } else if (f.kind === "yesno" || f.kind === "multi") {
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
                    // peer-checked (not :has) so the selected state also shows on older phone browsers
                    <label key={o} className="relative block cursor-pointer">
                      <input
                        type={f.kind === "yesno" ? "radio" : "checkbox"}
                        value={o}
                        className="peer absolute top-1/2 left-3 -translate-y-1/2 accent-[#111]"
                        {...register(f.name)}
                      />
                      <span className="border-ink bg-card peer-checked:bg-sun peer-focus-visible:outline-ring flex min-h-12 items-center rounded-[10px] border-3 py-2 pr-3 pl-9 text-sm font-semibold peer-checked:shadow-[3px_3px_0_0_#111] peer-focus-visible:outline-2">
                        {o}
                      </span>
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
          } else if (f.kind === "grid") {
            const groupErr = typeof err === "string" ? err : undefined;
            control = (
              <fieldset
                className="space-y-3"
                aria-describedby={groupErr ? `${f.name}-error` : undefined}
              >
                <legend className="text-sm font-medium">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </legend>
                {f.hint && <p className="text-muted text-xs">{f.hint}</p>}
                {visibleGridRows(f, values).map((r) => (
                  <div key={r.key} className="border-ink bg-card rounded-[10px] border-3 p-4">
                    <p className="mb-3 text-sm font-semibold">
                      {r.label}
                      {f.required && r.required && <span className="text-destructive"> *</span>}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {f.columns!.map((c) => {
                        const path = `${f.name}.${r.key}.${c.key}`;
                        const id = path.replace(/\./g, "-");
                        const cErr = cellError(path);
                        const cInv = {
                          "aria-invalid": !!cErr,
                          "aria-describedby": cErr ? `${id}-error` : undefined,
                        };
                        return (
                          <Field key={c.key} id={id} label={c.label} error={cErr}>
                            {c.kind === "multi" ? (
                              <MultiSelect
                                id={id}
                                options={c.options!}
                                selected={cellList(path)}
                                register={register(path)}
                                invalid={!!cErr}
                                describedBy={cErr ? `${id}-error` : undefined}
                              />
                            ) : c.kind === "select" ? (
                              <NativeSelect id={id} defaultValue="" {...cInv} {...register(path)}>
                                <option value="">Select</option>
                                {c.options!.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </NativeSelect>
                            ) : (
                              <Input
                                id={id}
                                maxLength={c.max}
                                placeholder={c.placeholder}
                                {...cInv}
                                {...register(path)}
                              />
                            )}
                          </Field>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {groupErr && (
                  <p id={`${f.name}-error`} role="alert" className="text-destructive text-sm">
                    {groupErr}
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
                ) : f.widget === "school" ? (
                  <SchoolCombobox
                    id={f.name}
                    value={(values[f.name] as string | undefined) ?? ""}
                    onChange={(v) => setValue(f.name, v, { shouldDirty: true })}
                    invalid={!!err}
                    describedBy={err ? `${f.name}-error` : undefined}
                  />
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
