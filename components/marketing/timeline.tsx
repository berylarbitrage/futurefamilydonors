/** Vertical numbered process list with oversized outline numerals. */
export function Timeline({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="border-primary divide-primary divide-y-2 border-y-2">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="grid grid-cols-[3.75rem_1fr] gap-4 py-5 sm:grid-cols-[5.5rem_1fr]"
        >
          <span
            aria-hidden
            className="text-outline font-display text-5xl leading-none font-bold tracking-tighter sm:text-6xl"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 pt-1">
            <h3 className="text-primary text-lg font-bold">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="text-muted mt-1">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
