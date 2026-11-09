import { redirect } from "next/navigation";

/** Old address (used in earlier emails): applicants now sign in at /portal/login. */
export default async function OldLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const k of ["next", "error"] as const) if (sp[k]) q.set(k, sp[k]!);
  redirect(`/portal/login${q.size ? `?${q}` : ""}`);
}
