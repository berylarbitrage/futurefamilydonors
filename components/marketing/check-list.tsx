import { Check } from "lucide-react";

export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="border-primary bg-card flex items-start gap-3 rounded-lg border-2 p-4"
        >
          <span className="bg-accent text-accent-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm">
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
