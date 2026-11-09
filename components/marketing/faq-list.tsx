import type { FaqItem } from "@/content/faq";
import { Plus } from "lucide-react";

/** Accessible accordion built on <details>, works without JS. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-primary/15 border-primary bg-card divide-y-2 rounded-lg border-2">
      {items.map((item) => (
        <details
          key={item.q}
          className="group open:bg-sun-soft/50 px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
            <span>{item.q}</span>
            <span className="border-primary group-open:bg-primary group-open:text-sun flex size-8 shrink-0 items-center justify-center rounded-md border-2 transition-colors">
              <Plus
                aria-hidden
                className="size-4 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                strokeWidth={3}
              />
            </span>
          </summary>
          <p className="text-muted mt-3 max-w-3xl">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
