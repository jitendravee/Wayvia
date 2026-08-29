import { useEffect, useState } from "react";

/**
 * Returns `value`, but delayed by `delayMs` after the last change — used
 * for the maxFare/maxDuration sliders in FiltersBar so dragging them
 * doesn't fire an /api/search request on every `onChange` tick. Discrete
 * filter clicks (connections, transport, sort, ...) don't go through this;
 * only the two continuous range inputs do.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Same idea as `useDebouncedValue`, but for a whole array at once — lets a
 * caller with a variable-length list (e.g. one value per trip leg) debounce
 * every entry with a single hook call instead of calling a hook once per
 * array item, which would break React's rules of hooks (hooks can't be
 * called inside a loop/`.map()`). Compares by JSON value, not identity, so
 * a new array with the same contents doesn't reset the timer.
 */
export function useDebouncedArray<T>(values: T[], delayMs: number): T[] {
  const [debounced, setDebounced] = useState(values);
  const key = JSON.stringify(values);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(values), delayMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the intentional dependency; `values` itself is a new array reference every render.
  }, [key, delayMs]);

  return debounced;
}
