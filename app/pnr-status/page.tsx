"use client";

import { Suspense, useState } from "react";
import PnrResultCard from "../components/PnrResultCard";
import { PnrApiResponse } from "@/lib/erail/pnrTypes";

export default function PnrStatusPage() {
  return (
    <Suspense fallback={null}>
      <PnrStatusInner />
    </Suspense>
  );
}

function PnrStatusInner() {
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PnrApiResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = pnr.trim();
    if (!/^\d{10}$/.test(trimmed)) {
      setError("PNR numbers are 10 digits — double check and try again.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/erail/pnrStatus?pnr=${trimmed}`, { cache: "no-store" });
      const json: PnrApiResponse = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Couldn't find that PNR. Double check the number and try again.");
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-12 sm:px-6">
      <header className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">PNR status</div>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Check your booking confirmation
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-muted">
          Enter your 10-digit PNR number to see confirmation status, coach and berth, and a visual seat map.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md gap-2">
        <input
          value={pnr}
          onChange={(e) => setPnr(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit PNR number"
          inputMode="numeric"
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-white px-4 py-3.5 font-mono text-[15px] tracking-wide text-ink outline-none transition-colors focus:border-violet focus:ring-4 focus:ring-violet-ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-violet px-6 py-3.5 font-display text-[14px] font-semibold text-white shadow-sm shadow-violet-soft transition-colors hover:bg-violet-dark disabled:opacity-60"
        >
          {loading ? "Checking…" : "Check PNR"}
        </button>
      </form>

      {error && (
        <div className="mx-auto mt-5 max-w-md rounded-lg border border-l-4 border-signal-red/30 border-l-signal-red bg-signal-red-soft/60 px-4 py-3 text-[13px] text-ink">
          {error}
        </div>
      )}

      {result?.data && (
        <div className="mt-10">
          <PnrResultCard data={result.data} />
        </div>
      )}

      {!result && !error && (
        <p className="mx-auto mt-10 max-w-md text-center text-[12px] leading-relaxed text-ink-dim">
          Your PNR is the 10-digit number printed on your ticket or e-ticket confirmation email. We only use it
          to look up your booking — nothing is stored.
        </p>
      )}
    </main>
  );
}
