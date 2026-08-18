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
  clear: "bg-signal-green",
  caution: "bg-signal-amber",
  stop: "bg-signal-red",
  unknown: "bg-ink-dim",
};

export const SIGNAL_LINE: Record<SignalState, string> = {
  clear: "bg-signal-green/60",
  caution: "bg-signal-amber/60",
  stop: "bg-signal-red/60",
  unknown: "bg-border",
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
