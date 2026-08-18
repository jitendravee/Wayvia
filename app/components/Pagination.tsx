"use client";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({ page, totalPages, onChange, disabled }: Props) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <div className="mt-5 flex items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-border px-3 py-1.5 font-mono text-[12px] text-ink-muted transition-colors hover:border-violet-ring hover:text-violet disabled:cursor-not-allowed disabled:opacity-40"
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-1.5 font-mono text-[12px] text-ink-dim">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p as number)}
            className={`h-8 min-w-8 rounded-lg px-2 font-mono text-[12px] transition-colors ${
              p === page ? "bg-violet text-white" : "border border-border text-ink-muted hover:border-violet-ring hover:text-violet"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-border px-3 py-1.5 font-mono text-[12px] text-ink-muted transition-colors hover:border-violet-ring hover:text-violet disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  const span = 1;
  const pages: (number | "…")[] = [];
  const add = (p: number) => pages.push(p);

  add(1);
  if (current - span > 2) pages.push("…");
  for (let p = Math.max(2, current - span); p <= Math.min(total - 1, current + span); p++) add(p);
  if (current + span < total - 1) pages.push("…");
  if (total > 1) add(total);

  return pages;
}
