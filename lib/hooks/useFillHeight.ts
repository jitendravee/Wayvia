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
  const lastHeight = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // Anything smaller than this is noise (rounding, scrollbar gutter,
  // mobile address-bar collapse/expand, rubber-band overscroll) — acting
  // on it just relayouts the page for no visible benefit, and on mobile
  // that relayout is itself what feeds the next spurious scroll/resize
  // event. Committing state only past this threshold breaks that loop.
  const TOLERANCE = 4;

  const recalc = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    if (window.innerWidth < belowPx) {
      if (lastHeight.current !== null) {
        lastHeight.current = null;
        setHeight(null);
      }
      return;
    }

    // visualViewport.height ignores the on-screen keyboard / address-bar
    // resize dance that makes window.innerHeight jump around on mobile;
    // fall back to innerHeight where it's unsupported.
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const top = el.getBoundingClientRect().top;
    const next = Math.max(minHeight, Math.round(viewportHeight - top - bottomGap));

    if (lastHeight.current === null || Math.abs(next - lastHeight.current) >= TOLERANCE) {
      lastHeight.current = next;
      setHeight(next);
    }
  }, [bottomGap, minHeight, belowPx]);

  // Coalesce bursts of scroll/resize events into at most one recalc per
  // animation frame, instead of one setState per raw event.
  const scheduleRecalc = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      recalc();
    });
  }, [recalc]);

  useEffect(() => {
    recalc();

    window.addEventListener("resize", scheduleRecalc);
    window.addEventListener("scroll", scheduleRecalc, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleRecalc);

    // Only watch the element itself (e.g. a border/padding change from a
    // style tweak), never document.body — observing body means our own
    // setHeight-driven layout change re-triggers this observer, which is
    // what turns a single resize into a runaway loop.
    const ro = new ResizeObserver(scheduleRecalc);
    if (ref.current) ro.observe(ref.current);

    return () => {
      window.removeEventListener("resize", scheduleRecalc);
      window.removeEventListener("scroll", scheduleRecalc);
      window.visualViewport?.removeEventListener("resize", scheduleRecalc);
      ro.disconnect();
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [recalc, scheduleRecalc]);

  return { ref, height };
}