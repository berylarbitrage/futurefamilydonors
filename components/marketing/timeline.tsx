import { cn } from "@/lib/utils";

const FILLS = ["bg-card", "bg-sun", "bg-card", "bg-mint"];

/** Process as a grid of sticker cards, each with a black "STEP n" tag. */
export function Timeline({
  steps,
  columns = 3,
}: {
  steps: { title: string; body: string }[];
  columns?: 3 | 4;
}) {
  return (
    <ol
      className={cn(
        "grid gap-5 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {steps.map((s, i) => (
        <li
          key={s.title}
          className={cn(
            "border-ink flex flex-col rounded-[14px] border-3 p-5 shadow-[5px_5px_0_0_#111]",
            FILLS[i % FILLS.length],
          )}
        >
          <span className="tag self-start" aria-hidden>
            Step {i + 1}
          </span>
          <h3 className="mt-4 text-xl leading-tight font-extrabold">
            <span className="sr-only">Step {i + 1}: </span>
            {s.title}
          </h3>
          <p className="mt-2">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Two-column numbered sticker cards with a big round number badge. */
export function NumberedSteps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-6 md:grid-cols-2">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="border-ink flex gap-4 rounded-[16px] border-3 bg-white p-5 shadow-[5px_5px_0_0_#111] md:p-6"
        >
          <span
            aria-hidden
            className={cn(
              "border-ink flex size-14 shrink-0 items-center justify-center rounded-full border-3 text-2xl font-extrabold shadow-[3px_3px_0_0_#111]",
              ["bg-sun", "bg-accent", "bg-mint"][i % 3],
            )}
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl leading-tight font-extrabold">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="mt-2">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
