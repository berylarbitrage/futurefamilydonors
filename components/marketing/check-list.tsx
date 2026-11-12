import { Check } from "lucide-react";

export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="border-ink bg-card flex items-start gap-3 rounded-[14px] border-3 p-4 font-medium shadow-[4px_4px_0_0_#111]"
        >
          <span className="bg-mint border-ink flex size-7 shrink-0 items-center justify-center rounded-md border-2">
            <Check className="size-4" strokeWidth={3.5} aria-hidden />
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ul>
  );
}
