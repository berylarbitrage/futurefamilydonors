"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import {
  ALL_SECTION_IDS,
  completionPercent,
  FORM_SECTIONS,
  FORM_SECTION_IDS,
  SECTION_TITLES,
  type FormSectionId,
  type SectionId,
} from "@/lib/full-app";
import type { DonorType } from "@/config/eligibility";
import { SectionForm } from "@/components/portal/section-form";
import { PhotoUploader, type PortalPhoto } from "@/components/portal/photo-uploader";
import { SignatureForm } from "@/components/portal/signature-form";
import { cn } from "@/lib/utils";

export function FullApplication({
  donorType,
  initialSections,
  initialCompleted,
  photos,
  submitted,
}: {
  donorType: DonorType;
  initialSections: Record<string, Record<string, unknown>>;
  initialCompleted: string[];
  photos: PortalPhoto[];
  submitted: boolean;
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  // A submitted application is 100% complete even if older data lacks the flags.
  const [completed, setCompleted] = useState<string[]>(
    submitted ? [...ALL_SECTION_IDS] : initialCompleted,
  );
  const firstOpen = ALL_SECTION_IDS.find((s) => !initialCompleted.includes(s)) ?? "background";
  const [active, setActive] = useState<SectionId>(submitted ? "background" : firstOpen);
  const pct = completionPercent(completed);

  const go = (s: SectionId) => {
    setActive(s);
    requestAnimationFrame(() => document.getElementById("section-heading")?.focus());
  };

  const def = FORM_SECTIONS.find((s) => s.id === active);

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <aside>
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-sm font-bold">
            <span className="tag">Progress</span>
            <span>{pct}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Application completion"
            className="flex gap-1"
          >
            {ALL_SECTION_IDS.map((s) => (
              <span key={s} className="seg" data-on={completed.includes(s)} aria-hidden />
            ))}
          </div>
        </div>
        <nav aria-label="Application sections">
          <ol className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
            {ALL_SECTION_IDS.map((s, i) => {
              const done = completed.includes(s);
              return (
                <li key={s} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => go(s)}
                    aria-current={active === s ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[10px] border-3 px-3 py-2 text-left text-sm font-semibold",
                      active === s
                        ? "border-ink bg-sun font-extrabold shadow-[3px_3px_0_0_#111]"
                        : "hover:border-ink border-transparent hover:bg-white",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="size-4 shrink-0" aria-label="Complete" />
                    ) : (
                      <Circle className="size-4 shrink-0" aria-label="Incomplete" />
                    )}
                    <span className="whitespace-nowrap">
                      {i + 1}. {SECTION_TITLES[s]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <section
        className="border-ink min-w-0 rounded-[16px] border-3 bg-white p-5 shadow-[6px_6px_0_0_#111] sm:p-8"
        aria-labelledby="section-heading"
      >
        <h2 id="section-heading" tabIndex={-1} className="text-2xl font-extrabold outline-none">
          {SECTION_TITLES[active]}
        </h2>
        {def && <p className="mt-1 mb-6 text-sm font-medium">{def.description}</p>}
        {!def && <div className="mb-6" />}

        {def && (
          <SectionForm
            key={active}
            section={active as FormSectionId}
            donorType={donorType}
            initial={sections[active] ?? {}}
            readOnly={submitted}
            onSaved={(c, data, advance) => {
              setCompleted(c);
              setSections((prev) => ({ ...prev, [active]: data }));
              if (advance) {
                const idx = ALL_SECTION_IDS.indexOf(active);
                const nextId = ALL_SECTION_IDS[idx + 1];
                if (nextId) go(nextId);
              }
            }}
          />
        )}
        {active === "photos" && (
          <PhotoUploader
            photos={photos}
            readOnly={submitted}
            onChange={(c) => {
              if (c) setCompleted(c);
              router.refresh();
            }}
          />
        )}
        {active === "signature" && (
          <SignatureForm
            submitted={submitted}
            missing={[...FORM_SECTION_IDS, "photos" as const]
              .filter((s) => !completed.includes(s))
              .map((s) => SECTION_TITLES[s])}
            onSubmitted={() => {
              setCompleted([...ALL_SECTION_IDS]);
              router.refresh();
            }}
          />
        )}
      </section>
    </div>
  );
}
