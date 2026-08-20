"use client";

type IconProps = { className?: string };

export function PinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function JunctionIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v6M12 15v6M6 9l6 3 6-3M6 15l6-3 6 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrainIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="4" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11h14M9 4v12M15 4v12" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="19" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="19" r="1.3" fill="currentColor" />
      <path d="M6 16l-1.5 3M18 16l1.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="6" width="17" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function RouteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="5.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 8v3a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2.5 2.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8.2" cy="13.2" r="1" fill="currentColor" />
      <circle cx="12" cy="13.2" r="1" fill="currentColor" />
      <circle cx="15.8" cy="13.2" r="1" fill="currentColor" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.2a1.6 1.6 0 0 0 0 3.2V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.6a1.6 1.6 0 0 0 0-3.2V9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 7v10" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
    </svg>
  );
}

export function SeatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 5v9a2 2 0 0 0 2 2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 14H5a2 2 0 0 0-2 2v3M16 16v4M18 20h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="14.5" y="10" width="4.5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function SwapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 7h11l-3-3M17 17H6l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}