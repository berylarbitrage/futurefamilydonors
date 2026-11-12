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
    title: type === "egg" ? "Egg Donor Pre-Screen (3 min)" : "Sperm Donor Pre-Screen (3 min)",
    alternates: { canonical: `/apply/${type}` },
  };
}

export default async function ApplyPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isDonorType(type)) notFound();
  return (
    <div className="bg-grain">
      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <p className="tag">{type === "egg" ? "Egg donor" : "Sperm donor"} application</p>
        <h1 className="mt-4 mb-8 text-[2.3rem] leading-[1.05] font-extrabold md:text-5xl">
          Do you <em className="em-sticker">pre-qualify?</em>
        </h1>
        <p className="-mt-3 mb-8 text-lg font-medium">
          Three short steps. About 3 minutes. Your answers stay private.
        </p>
        <PrescreenForm type={type} turnstileSiteKey={turnstileSiteKey()} />
      </div>
    </div>
  );
}
