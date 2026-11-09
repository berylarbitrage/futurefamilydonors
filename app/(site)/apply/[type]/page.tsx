import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrescreenForm } from "@/components/apply/prescreen-form";
import { isDonorType } from "@/config/eligibility";
import { turnstileSiteKey } from "@/lib/turnstile";

export function generateStaticParams() {
  return [{ type: "egg" }, { type: "sperm" }];
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  return {
    title: type === "egg" ? "Egg Donor Pre-Screen" : "Sperm Donor Pre-Screen",
    alternates: { canonical: `/apply/${type}` },
  };
}

export default async function ApplyPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isDonorType(type)) notFound();
  return (
    <div className="bg-dots">
      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <p className="text-accent-strong flex items-center gap-3 text-xs font-bold tracking-[0.24em] uppercase">
          <span className="bg-accent size-2.5" aria-hidden />
          {type === "egg" ? "Egg donor" : "Sperm donor"} application
        </p>
        <h1 className="text-primary mt-3 mb-8 text-[2.25rem] leading-[1.05] font-bold md:text-5xl">
          Let&apos;s see if you pre-qualify
        </h1>
        <PrescreenForm type={type} turnstileSiteKey={turnstileSiteKey()} />
      </div>
    </div>
  );
}
