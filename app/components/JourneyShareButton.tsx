"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { AnnotatedJourney } from "../types";
import { durationLabel } from "./status";
import { getStationCityName, getCrossStationTransfer } from "@/lib/geo";

function formatTravelTime(raw?: string): string {
  if (!raw) return "";
  const [h, m] = raw.split(".");
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return raw;
  return `${hh}h ${String(mm).padStart(2, "0")}m`;
}

/** Formats a rich, highly shareable WhatsApp itinerary */
export function generateWhatsAppOverview(
  journey: AnnotatedJourney,
  searchDate?: string,
): string {
  const originCode = journey.legs[0]?.from || "Origin";
  const destCode = journey.legs[journey.legs.length - 1]?.to || "Destination";
  const originCity = getStationCityName(originCode);
  const destCity = getStationCityName(destCode);

  const hubs = [journey.hub, journey.hub2, journey.hub3]
    .filter(Boolean)
    .map((h) => `${getStationCityName(h!)} (${h})`)
    .join(" ➔ ");

  const duration = durationLabel(journey.totalDurationMin);
  const fare = journey.totalFare ? `₹${journey.totalFare}` : "Check Fare";
  const status = journey.fullyConfirmed
    ? "✅ CONFIRMED SEATS AVAILABLE"
    : journey.hasBlockedLeg
      ? "⚠️ SOME LEGS WAITLISTED"
      : "ℹ️ PARTIALLY CONFIRMED";

  const siteBase =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://wayvia.xyz";

  // Build a direct search URL so recipient can open the exact route
  let deepLink = `${siteBase}/journey-planner`;
  if (typeof window !== "undefined" && window.location.search) {
    deepLink = `${siteBase}/journey-planner${window.location.search}`;
  } else if (originCode && destCode) {
    const qDate = searchDate ? `&date=${searchDate}` : "";
    deepLink = `${siteBase}/journey-planner?from=${originCode}&to=${destCode}${qDate}`;
  }

  let text = `🚆 *${originCity} (${originCode}) ➔ ${destCity} (${destCode}) Route*\n`;
  if (searchDate) {
    text += `📅 *Travel Date:* ${searchDate}\n`;
  }
  if (hubs) {
    text += `📍 *Connecting Junction:* ${hubs}\n`;
  }
  text += `⏱️ *Total Travel Time:* ${duration}\n`;
  text += `💰 *Est. Total Fare:* ${fare}\n`;
  text += `💺 *Status:* ${status}\n`;
  text += `─────────────────────────\n`;

  journey.legs.forEach((leg, idx) => {
    const modeEmoji =
      leg.mode === "bus" ? "🚌" : leg.mode === "flight" ? "✈️" : "🚆";
    const fromCity = getStationCityName(leg.from);
    const toCity = getStationCityName(leg.to);
    const avlStatus =
      leg.availability?.category === "AVAILABLE"
        ? `Available (${leg.availability.count ?? "Berths"})`
        : leg.availability?.rawStatus || "Check Live";

    text += `\n*Leg ${idx + 1}:* ${modeEmoji} ${
      leg.mode === "train" ? `Train #${leg.trainNo} ` : ""
    }${leg.trainName}\n`;
    text += `   Board: *${leg.from}* (${fromCity}) at *${leg.departure}*\n`;
    text += `   Arrive: *${leg.to}* (${toCity}) at *${leg.arrival}*\n`;
    text += `   ⏱️ ${formatTravelTime(leg.travelTime)} | 💺 ${avlStatus}\n`;

    if (idx < journey.legs.length - 1) {
      const layoverMin =
        journey.gapsMin && idx < journey.gapsMin.length
          ? journey.gapsMin[idx]
          : undefined;
      const transfer = getCrossStationTransfer(
        leg.to,
        journey.legs[idx + 1]?.from,
      );

      text += `\n  ──────────────────\n`;
      if (transfer) {
        text += `  ⚠️ *Station Transfer in ${transfer.city}*\n`;
        text += `     ${leg.to} ➔ ${journey.legs[idx + 1].from} (~45m cab/metro)\n`;
      }
      if (layoverMin !== undefined) {
        text += `  ⏱️ *Layover:* ${layoverMin} mins buffer at ${toCity} (${leg.to})\n`;
      }
      text += `  ──────────────────\n`;
    }
  });

  text += `\n─────────────────────────\n`;
  text += `💡 *Found on Wayvia* — smart split routes when direct trains are sold out!\n`;
  text += `🔗 *View full route & live seat map:*\n${deepLink}`;

  return text;
}

export default function JourneyShareButton({
  journey,
  searchDate,
  variant = "compact",
}: {
  journey: AnnotatedJourney;
  searchDate?: string;
  variant?: "compact" | "full" | "prominent";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = generateWhatsAppOverview(journey, searchDate);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = generateWhatsAppOverview(journey, searchDate);
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
    >
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.954-1.399A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.604 0-3.089-.472-4.337-1.282l-.31-.202-2.92.766.779-2.846-.222-.353A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167s8.167 3.664 8.167 8.167-3.664 8.167-8.167 8.167z" />
    </svg>
  );

  if (variant === "prominent") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleWhatsAppShare}
          aria-label="Share route on WhatsApp"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 font-display text-[12.5px] font-semibold shadow-sm shadow-emerald-600/30 transition-all"
        >
          <WhatsAppIcon className="h-4 w-4 text-white" />
          <span>Share on WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy itinerary"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white hover:border-violet hover:text-violet px-3 py-2 font-mono text-[12px] font-medium text-ink-muted transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check
                size={14}
                className="text-signal-green"
                strokeWidth={2.5}
              />
              <span className="text-signal-green font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-ink-dim" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* WhatsApp Share Button */}
      {/* <button
        type="button"
        onClick={handleWhatsAppShare}
        aria-label="Share journey overview on WhatsApp"
        title="Share route itinerary with friends or family on WhatsApp"
        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50/80 px-2.5 py-1.5 font-display text-[12px] font-semibold text-emerald-800 transition-all hover:bg-emerald-100 hover:border-emerald-600 hover:shadow-xs active:scale-95 sm:px-3 sm:text-[12.5px]"
      >
        <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Share on WhatsApp</span>
        <span className="sm:hidden">WhatsApp</span>
      </button> */}

      {/* Copy Itinerary Overview Button */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy journey overview to clipboard"
        title="Copy route itinerary to clipboard"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-display text-[12px] font-medium text-ink-muted transition-all hover:border-violet hover:text-violet active:scale-95 sm:px-3 sm:text-[12.5px]"
      >
        {copied ? (
          <>
            <Check size={13} className="text-signal-green" strokeWidth={2.5} />
            <span className="text-signal-green font-semibold">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={13} className="text-ink-dim" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
