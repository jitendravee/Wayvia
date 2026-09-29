/**
 * Apple Design & Fluid Motion Physics (WWDC Translated for Web)
 * 
 * Springs replace fixed-duration curves:
 * - Critically damped (damping: 1.0 equivalent, ~0.35s response): no bounce, smooth settle
 * - Bouncy spring (damping: ~0.8 equivalent): for momentum gestures & physical flicks
 * - Sheet / Drawer spring: snappy response (0.3s) for modal sheets and overlays
 */

import type { Transition } from "framer-motion";

/** Standard critically damped spring (Apple default UI move/fade) */
export const appleSpring: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 32,
  mass: 0.8,
};

/** Momentum & flick spring (subtle natural bounce) */
export const appleBounceSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 24,
  mass: 0.8,
};

/** Sheet / Drawer / Modal presentation spring */
export const appleSheetSpring: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 30,
  mass: 0.9,
};

/** Dropdown menu & Popover spring (origin-anchored, ultra snappy) */
export const appleDropdownSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
  mass: 0.7,
};

/** Interactive tap micro-spring */
export const appleTapSpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

/** iOS System Fluid cubic-bézier (when CSS transitions are required) */
export const APPLE_EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const APPLE_EASE_IN_OUT = [0.32, 0.72, 0, 1] as const;

/**
 * Apple Momentum Projection formula (Designing Fluid Interfaces WWDC):
 * Projects final endpoint from release velocity using exponential decay.
 * @param velocity in px/s
 * @param decelerationRate ~0.998 for standard scroll/flick feel
 */
export function projectMomentum(
  velocity: number,
  decelerationRate = 0.998,
): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Apple Rubber-band formula for soft boundary drag resistance:
 * @param overshoot distance dragged past boundary
 * @param dimension container dimension (width or height)
 * @param constant Apple default 0.55
 */
export function appleRubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}
