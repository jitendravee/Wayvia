import type { AvlStatusCategory } from "../types";

export type SignalState = "clear" | "caution" | "stop" | "unknown";

export function signalFor(category?: AvlStatusCategory | null): SignalState {
  switch (category) {
    case "AVAILABLE":
      return "clear";
    case "WAITLIST":
    case "RAC":
      return "caution";
    case "NOT_AVAILABLE":
    case "REGRET":
      return "stop";
    default:
      return "unknown";
  }
}

export const SIGNAL_LABEL: Record<AvlStatusCategory, string> = {
  AVAILABLE: "Available",
  WAITLIST: "Waitlisted",
  RAC: "RAC",
  NOT_AVAILABLE: "Not available",
  REGRET: "Regret",
  UNKNOWN: "Unknown",
};

export const SIGNAL_DOT: Record<SignalState, string> = {
  clear: "bg-signal-green shadow-[0_0_8px_var(--color-signal-green)]",
  caution: "bg-signal-amber shadow-[0_0_8px_var(--color-signal-amber)]",
  stop: "bg-signal-red shadow-[0_0_8px_var(--color-signal-red)]",
  unknown: "bg-ink-dim",
};

export const SIGNAL_LINE: Record<SignalState, string> = {
  clear: "bg-signal-green/70",
  caution: "bg-signal-amber/70",
  stop: "bg-signal-red/70",
  unknown: "bg-board-line",
};

export const SIGNAL_TEXT: Record<SignalState, string> = {
  clear: "text-signal-green",
  caution: "text-signal-amber",
  stop: "text-signal-red",
  unknown: "text-ink-dim",
};

export function durationLabel(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${h}h ${m}m`;
}
