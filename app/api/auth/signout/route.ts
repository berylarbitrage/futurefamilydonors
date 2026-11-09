import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST(req: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  // ?to=admin|catalog returns to that area's sign-in page.
  const area = new URL(req.url).searchParams.get("to");
  const to = area === "admin" ? "/admin/login" : area === "catalog" ? "/catalog/login" : "/";
  return NextResponse.redirect(new URL(to, req.url), { status: 303 });
}
