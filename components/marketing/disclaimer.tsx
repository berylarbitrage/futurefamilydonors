import { DISCLAIMER } from "@/config/site";

export function Disclaimer() {
  return (
    <aside className="mx-auto max-w-6xl px-4">
      <p className="border-primary bg-card text-muted rounded-md border-l-4 p-4 text-sm">
        <strong className="text-foreground">Please note:</strong> {DISCLAIMER}
      </p>
    </aside>
  );
}
