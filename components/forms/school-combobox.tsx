"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SchoolMatch {
  name: string;
  country: string;
}

/**
 * Type-ahead picker over the world universities list (/api/schools).
 * Applicants pick a suggestion, or keep whatever they typed if their school
 * isn't listed — the value is always the plain school name.
 */
export function SchoolCombobox({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SchoolMatch[]>([]);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const j = (await res.json()) as { results?: SchoolMatch[] };
        setResults(j.results ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline: keep free text */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const pick = (m: SchoolMatch) => {
    onChange(m.name);
    setOpen(false);
    setResults([]);
  };

  const showList = open && query.trim().length >= 2;

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        maxLength={120}
        placeholder="Start typing to search schools worldwide"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!showList || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(results[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="border-ink absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-[12px] border-3 bg-white py-1 shadow-[4px_4px_0_0_#111]"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((m, i) => (
            <li
              key={`${m.name}|${m.country}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={cn(
                "cursor-pointer px-4 py-2 text-sm",
                i === active ? "bg-sun-soft" : "hover:bg-sun-soft",
              )}
              onClick={() => pick(m)}
            >
              <span className="font-semibold">{m.name}</span>
              {m.country && <span className="text-muted"> · {m.country}</span>}
            </li>
          ))}
          <li className="text-muted px-4 py-2 text-xs">
            {results.length === 0
              ? "No match in our list — that's fine, just type the full school name."
              : "Not listed? Just type the full school name."}
          </li>
        </ul>
      )}
    </div>
  );
}
