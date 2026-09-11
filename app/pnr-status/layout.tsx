import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check PNR Status Live & Visual Berth Layout",
  description:
    "Check your 10-digit Indian Railways IRCTC PNR confirmation status in real time. View coach position, berth number, visual seat layout, and RAC / waitlist confirmation chances.",
  keywords: [
    "PNR status",
    "check PNR status",
    "live PNR status",
    "IRCTC PNR check",
    "railway PNR status",
    "PNR confirmation probability",
    "train seat map PNR",
    "berth allotment check",
  ],
  alternates: {
    canonical: "/pnr-status",
  },
  openGraph: {
    title: "Check PNR Status Live & Visual Berth Layout | Wayvia",
    description:
      "Instant IRCTC PNR confirmation check with visual coach layout, berth allocation, and live waiting list chances.",
  },
};

export default function PnrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
