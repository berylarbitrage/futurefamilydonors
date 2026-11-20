import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/supabase/admin";

/** Signed links handed out by this route stay valid this long. */
const SIGNED_URL_TTL = 60 * 60; // 1 hour
/** The browser may reuse the redirect for this long (well inside the TTL). */
const CACHE_SECONDS = 30 * 60;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Shows one of the signed-in applicant's own photos. The page links here
 * instead of embedding a signed URL, so photos never "expire" while someone
 * spends a long time filling in the full application: every time the image
 * loads, it gets a fresh short-lived link. RLS (photos + storage) limits this
 * to the applicant's own files (and staff).
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorJson("Not found", 404);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("Not found", 404);

  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!photo) return errorJson("Not found", 404);

  const { data: signed } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl((photo as { storage_path: string }).storage_path, SIGNED_URL_TTL);
  if (!signed?.signedUrl) return errorJson("Not found", 404);

  const res = NextResponse.redirect(signed.signedUrl, 302);
  res.headers.set("Cache-Control", `private, max-age=${CACHE_SECONDS}`);
  return res;
}
