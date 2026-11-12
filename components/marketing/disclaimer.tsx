import { DISCLAIMER } from "@/config/site";

export function Disclaimer() {
  return (
    <aside className="mx-auto max-w-6xl px-4">
      <p className="border-ink bg-card rounded-[14px] border-3 border-dashed p-4 text-sm">
        <strong className="tag mr-2 align-middle">Please note</strong> {DISCLAIMER}
      </p>
    </aside>
  );
}
