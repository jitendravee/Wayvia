import { Metadata } from "next";
import { Suspense } from "react";
import JourneyCardClient from "@/app/journey-card/JourneyCardClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pnr: string }>;
}): Promise<Metadata> {
  const { pnr } = await params;
  return {
    title: `Live Train Journey Passport - PNR ${pnr} | Wayvia`,
    description: `Track live confirmation odds, coach platform position, and train status for IRCTC PNR ${pnr} on Wayvia.`,
    alternates: {
      canonical: `/pnr/${pnr}`,
    },
    openGraph: {
      title: `Live Train Journey Passport - PNR ${pnr}`,
      description: `Track live confirmation odds, coach platform position, and train status for IRCTC PNR ${pnr}.`,
      url: `https://wayvia.xyz/pnr/${pnr}`,
      siteName: "Wayvia",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Wayvia Live Journey Passport PNR ${pnr}`,
        },
      ],
      type: "website",
    },
  };
}

export default async function PublicPnrJourneyPage({
  params,
}: {
  params: Promise<{ pnr: string }>;
}) {
  const { pnr } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 text-center text-ink-muted">
          Loading live journey passport for PNR {pnr}…
        </div>
      }
    >
      <JourneyCardClient initialPnr={pnr} />
    </Suspense>
  );
}
