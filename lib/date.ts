/** YYYY-MM-DD for "today", used as the default date for any search form. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "18 Aug 2026" / "Select date" style formatting for a YYYY-MM-DD string. */
export function formatDatePretty(iso: string, opts?: { fallback?: string }): string {
  if (!iso) return opts?.fallback ?? "Select date";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}