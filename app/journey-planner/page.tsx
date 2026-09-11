import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageInner } from "../components/PageClient";

export const metadata: Metadata = {
  title:
    "Smart Train & Bus Journey Planner — Confirmed Routes When Direct Trains Are Full",
  description:
    "Direct trains waitlisted or full? Wayvia discovers connecting trains via junction hubs, train + bus combos, and split-ticket options with confirmed seats across India.",
  keywords: [
    "train journey planner",
    "alternative train routes",
    "connecting train search",
    "confirmed train ticket options",
    "train bus combo booking",
    "waitlist ticket alternative",
    "smart train routes india",
  ],
  alternates: {
    canonical: "/journey-planner",
  },
  openGraph: {
    title: "Smart Train & Bus Journey Planner | Wayvia",
    description:
      "Find connecting trains via hubs and multi-modal options when direct trains are sold out.",
  },
};

export default async function Page() {
  await connection();
  return (
    <Suspense fallback={null}>
      <div className="mt-20">
        <PageInner />
      </div>
    </Suspense>
  );
}
