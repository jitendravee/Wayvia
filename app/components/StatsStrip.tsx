import type { SearchResponse } from "../types";

export default function StatsStrip({ data }: { data: SearchResponse }) {
  const items: { label: string; value: string }[] = [
    { label: "route", value: `${data.from} → ${data.to}` },
    { label: "date", value: data.date },
  ];

  if (data.graph) {
    items.push({ label: "explored", value: `${data.graph.nodesDiscovered} stations · ${data.graph.edgesDiscovered} legs` });
  }
  if (data.candidates) {
    items.push({ label: "direct", value: String(data.candidates.direct) });
    items.push({ label: "via a junction", value: String(data.candidates.oneConnection) });
  }

  return (
    <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-xs text-ink-muted">
      {items.map((item) => (
        <span key={item.label}>
          {item.label} <b className="text-ink">{item.value}</b>
        </span>
      ))}
    </div>
  );
}
