import { json } from "@/lib/api";
import { searchSchools } from "@/lib/schools";

/** GET /api/schools?q=chicago — suggestions for the pre-screen school picker. */
export function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 100);
  return json(
    { results: searchSchools(q) },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
