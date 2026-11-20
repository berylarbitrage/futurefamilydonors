import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/supabase/admin";

const SIGNED_URL_TTL = 10 * 60; // 10 minutes

type Ctx = { params: Promise<{ id: string }> };

/**
 * Opens one uploaded document (applicant: their own; staff: anyone's — RLS on
 * `documents` and storage decides). `?download=1` saves it with its file name.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorJson("Not found", 404);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("Not found", 404);

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path,file_name")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return errorJson("Not found", 404);
  const d = doc as { storage_path: string; file_name: string };

  const download = new URL(req.url).searchParams.get("download") === "1";
  const { data: signed } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(d.storage_path, SIGNED_URL_TTL, download ? { download: d.file_name } : {});
  if (!signed?.signedUrl) return errorJson("Not found", 404);

  const res = NextResponse.redirect(signed.signedUrl, 302);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
