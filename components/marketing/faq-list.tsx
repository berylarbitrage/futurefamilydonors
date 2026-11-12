import type { FaqItem } from "@/content/faq";
import { Plus } from "lucide-react";

/** Accessible accordion built on <details>, works without JS. Each item is its own sticker box. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <details
          key={item.q}
          className="group border-ink bg-card open:bg-sun-soft rounded-[14px] border-3 shadow-[4px_4px_0_0_#111] [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[11px] px-5 py-4 text-lg font-bold">
            <span>{item.q}</span>
            <span className="border-ink bg-sun group-open:bg-accent flex size-9 shrink-0 items-center justify-center rounded-lg border-3 transition-colors">
              <Plus
                aria-hidden
                className="size-4 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                strokeWidth={3.5}
              />
            </span>
          </summary>
          <p className="max-w-3xl px-5 pb-5">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
