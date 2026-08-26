"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Measures the real vertical space between an element's top edge and the
 * bottom of the viewport, in px — no vh/dvh involved, so it's correct
 * regardless of navbar height, mobile browser chrome, zoom, or anything
 * else that makes a fixed vh percentage lie.
 *
 * Meant for an element that's `sticky` at a known top offset: once
 * scrolled to, its distance from the viewport top stops changing, so the
 * height this returns is stable while scrolling and only genuinely
 * changes on resize / content changes above it.
 *
 * Below `belowPx` viewport width the hook returns `null` (not a number),
 * signalling "don't constrain the height" — on mobile you generally want
 * the column to flow naturally instead of scrolling in a box.
 */
export function useFillHeight<T extends HTMLElement>(
  bottomGap = 24,
  minHeight = 320,
  belowPx = 768,
) {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  const recalc = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    if (window.innerWidth < belowPx) {
      setHeight(null);
      return;
    }

    const top = el.getBoundingClientRect().top;
    const next = Math.max(minHeight, Math.round(window.innerHeight - top - bottomGap));
    setHeight(next);
  }, [bottomGap, minHeight, belowPx]);

  useEffect(() => {
    recalc();

    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, { passive: true });

    const ro = new ResizeObserver(recalc);
    if (ref.current) ro.observe(document.body);

    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc);
      ro.disconnect();
    };
  }, [recalc]);

  return { ref, height };
}