import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getFullApp, getOwnApplication, photosComplete, withSection } from "@/lib/portal";
import { FullApplication } from "@/components/portal/full-application";
import type { PortalPhoto } from "@/components/portal/photo-uploader";
import type { PortalDocument } from "@/components/portal/document-uploader";

export const metadata: Metadata = { title: "Full Application" };

export default async function FullApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const { supabase, user } = await requireUser("/portal/application");
  const app = await getOwnApplication(supabase, user.id);
  if (!app) redirect("/portal");
  const full = await getFullApp(supabase, app.id);

  const { data: photoRows } = await supabase
    .from("photos")
    .select("id,kind")
    .eq("application_id", app.id)
    .order("created_at");
  // Each image loads through /api/portal/photo/[id], which signs a fresh link
  // every time, so photos keep working however long the page stays open.
  const photos: PortalPhoto[] = (photoRows ?? []).map((p) => ({
    id: p.id,
    kind: p.kind,
    url: `/api/portal/photo/${p.id}`,
  }));

  // Optional supporting documents (table added by 20261122000000_documents.sql;
  // if it isn't there yet the step simply shows no documents).
  const { data: docRows } = await supabase
    .from("documents")
    .select("id,doc_type,file_name,size_bytes,created_at")
    .eq("application_id", app.id)
    .order("created_at");
  const documents: PortalDocument[] = (docRows ?? []).map((d) => ({
    id: d.id as string,
    docType: d.doc_type as string,
    fileName: d.file_name as string,
    sizeBytes: d.size_bytes as number,
    createdAt: d.created_at as string,
  }));

  // Photos added in the pre-screen count: with 3+ the Photos step is already
  // done (no need to upload again). Keep the stored flag in step with them.
  let completedSections = full?.completed_sections ?? [];
  if (!full?.submitted_at) {
    const done = photosComplete(photos.map((p) => p.kind));
    if (done !== completedSections.includes("photos")) {
      completedSections = withSection(completedSections, "photos", done);
      await supabase
        .from("full_applications")
        .upsert({ application_id: app.id, completed_sections: completedSections });
    }
  }

  // The pre-screen already asked for a school: start the full application's
  // "College or university" answer from it so applicants don't type it twice.
  const initialSections: Record<string, Record<string, unknown>> = { ...(full?.sections ?? {}) };
  if (!full?.submitted_at && !initialSections.education?.school) {
    const { data: pre } = await supabase
      .from("applications")
      .select("prescreen_details")
      .eq("id", app.id)
      .maybeSingle();
    const schools = (pre?.prescreen_details as { schools?: { name?: string }[] } | null)?.schools;
    const names = (schools ?? []).map((s) => s.name?.trim()).filter((n): n is string => !!n);
    if (names.length) {
      const [school, school2, school3] = names;
      initialSections.education = {
        ...initialSections.education,
        school,
        ...(school2 ? { school2 } : {}),
        ...(school3 ? { school3 } : {}),
      };
    }
  }

  return (
    <div>
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm font-bold underline decoration-2"
      >
        <ArrowLeft className="size-4" aria-hidden /> Portal home
      </Link>
      <h1 className="mt-3 mb-6 text-3xl font-extrabold md:text-4xl">Your full application</h1>
      {welcome && !full?.submitted_at && (
        <div
          role="status"
          className="bg-mint border-ink mb-6 rounded-[14px] border-3 p-4 text-sm shadow-[4px_4px_0_0_#111]"
        >
          <strong>Welcome — you&apos;re invited to the full application!</strong> Work through the
          sections below. Your answers save automatically as you type, so you can stop any time and
          sign in later to continue.
        </div>
      )}
      <FullApplication
        donorType={app.donor_type}
        initialSections={initialSections}
        initialCompleted={completedSections}
        photos={photos}
        documents={documents}
        submitted={!!full?.submitted_at}
      />
    </div>
  );
}
