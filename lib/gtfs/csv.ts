/**
 * Minimal RFC4180-ish CSV parser — good enough for GTFS static files
 * (quoted fields, doubled-quote escaping, comma/CRLF/LF handling, an
 * optional leading UTF-8 BOM, which several published GTFS feeds include).
 * Not a general-purpose CSV library — written narrowly for GTFS rather than
 * adding a dependency for what's ~50 lines of parsing.
 */
export function parseCsv(text: string): Record<string, string>[] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\r") {
      if (text[i + 1] === "\n") i++;
      pushRow();
    } else if (c === "\n") {
      pushRow();
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) pushRow();

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) rec[header[c]] = (rows[r][c] ?? "").trim();
    out.push(rec);
  }
  return out;
}
