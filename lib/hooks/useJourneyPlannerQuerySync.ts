"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps the journey planner's URL query string (`?from=&to=&date=`) in sync
 * with the current search values — including after a swap — so refreshing
 * the page, or sharing the link, restores exactly what was on screen:
 *
 *   http://localhost:3000/journey-planner?from=ADI&to=PUNE&date=2026-08-31
 *
 * This only WRITES changes back out to the URL. Read the *initial* values
 * from the URL yourself, once, wherever you build the `values` object you
 * pass to <SearchForm /> — see the usage note below.
 */
export function useJourneyPlannerQuerySync(values: {
  from: string;
  to: string;
  date: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Skip writing on the very first render. If `values` was itself seeded
  // from the URL (see usage below) this would be a harmless no-op anyway,
  // but skipping it avoids an extra history entry on initial load.
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (values.from) params.set("from", values.from);
    else params.delete("from");

    if (values.to) params.set("to", values.to);
    else params.delete("to");

    if (values.date) params.set("date", values.date);
    else params.delete("date");

    // replace (not push) — swapping stations shouldn't pile up back-button
    // history entries — and scroll:false so it doesn't jump the page.
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.from, values.to, values.date]);
}