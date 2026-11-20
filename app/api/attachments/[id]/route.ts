import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, PHOTO_BUCKET } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Open a message attachment. Who may see it is decided by RLS on
 * message_attachments (the applicant: files on their own sent messages;
 * staff: all). `?download=1` saves it with its file name.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorJson("Not found", 404);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("Not found", 404);

  const { data } = await supabase
    .from("message_attachments")
    .select("storage_path,file_name")
    .eq("id", id)
    .maybeSingle();
  if (!data) return errorJson("Not found", 404);
  const a = data as { storage_path: string; file_name: string };

  // The row check above is the permission check; sign with the service role
  // (storage rules don't cover staff-uploaded files in the applicant's folder
  // for every role).
  const download = new URL(req.url).searchParams.get("download") === "1";
  const { data: signed } = await createAdminClient()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrl(a.storage_path, 60 * 60, download ? { download: a.file_name } : {});
  if (!signed?.signedUrl) return errorJson("Not found", 404);
  const res = NextResponse.redirect(signed.signedUrl, 302);
  res.headers.set("Cache-Control", "private, max-age=1800");
  return res;
}
