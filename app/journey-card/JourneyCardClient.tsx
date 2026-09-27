"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Share2,
  Copy,
  Check,
  Download,
  Train,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  QrCode,
  Flame,
  Search,
  Compass,
} from "lucide-react";
import {
  JourneyPassportData,
  buildJourneyPassport,
  VERIFIED_SAMPLE_PRESETS,
} from "@/lib/journey-card/journeyCardEngine";
import { PnrApiResponse, PnrData } from "@/lib/erail/pnrTypes";
import RelatedBlogGuides from "../components/RelatedBlogGuides";

export default function JourneyCardClient({
  initialPnr,
}: {
  initialPnr?: string;
}) {
  const [pnrInput, setPnrInput] = useState(initialPnr || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passport, setPassport] = useState<JourneyPassportData>(() =>
    buildJourneyPassport(VERIFIED_SAMPLE_PRESETS[0].data),
  );
  const [copiedText, setCopiedText] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
  const [cardTheme, setCardTheme] = useState<"dark" | "light">("dark");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-fetch if initialPnr is passed
  useEffect(() => {
    if (initialPnr && /^\d{10}$/.test(initialPnr)) {
      fetchPnr(initialPnr);
    }
  }, [initialPnr]);

  async function fetchPnr(targetPnr: string) {
    const trimmed = targetPnr.trim();
    if (!/^\d{10}$/.test(trimmed)) {
      setError("Please enter a valid 10-digit Indian Railways PNR number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/erail/pnrStatus?pnr=${trimmed}`, {
        cache: "no-store",
      });
      const json: PnrApiResponse = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(
          json.error ||
            "Could not fetch live PNR from railway servers. You can explore with our verified train presets below.",
        );
      }
      setPassport(buildJourneyPassport(json.data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Railway server timeout. Try one of the verified sample trains below.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePresetSelect(presetData: PnrData) {
    setPnrInput(presetData.pnrNumber);
    setError(null);
    setPassport(buildJourneyPassport(presetData));
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(passport.whatsAppText);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
  }

  function handleCopyText() {
    navigator.clipboard.writeText(passport.whatsAppText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  }

  function handleDownloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloadingImg(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render Canvas Boarding Pass (1200 x 630 standard card)
    canvas.width = 1200;
    canvas.height = 680;

    const isDark = cardTheme === "dark";

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 680);
    if (isDark) {
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(0.5, "#1e1b4b");
      bgGrad.addColorStop(1, "#0f172a");
    } else {
      bgGrad.addColorStop(0, "#f8fafc");
      bgGrad.addColorStop(1, "#eef2ff");
    }
    ctx.fillStyle = bgGrad;
    ctx.roundRect(0, 0, 1200, 680, 32);
    ctx.fill();

    // 2. Decorative Border & Header Accent
    ctx.lineWidth = 3;
    ctx.strokeStyle = isDark ? "#4338ca" : "#c7d2fe";
    ctx.stroke();

    // 3. Brand Header
    ctx.fillStyle = isDark ? "#a5b4fc" : "#4f46e5";
    ctx.font = "bold 20px monospace";
    ctx.fillText("WAYVIA • LIVE RAILWAY JOURNEY PASSPORT", 60, 65);

    // 4. Verification Stamp Badge
    ctx.fillStyle = isDark ? "#10b981" : "#059669";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`✓ PNR ${passport.pnr} · ${passport.chartStatus}`, 820, 65);

    // 5. Divider Line
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 95);
    ctx.lineTo(1140, 95);
    ctx.stroke();

    // 6. Train Number & Name
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(
      `${passport.trainNumber} ${passport.trainName.toUpperCase()}`,
      60,
      155,
    );

    // 7. Route Display (From -> To)
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = isDark ? "#cbd5e1" : "#334155";
    ctx.fillText(`${passport.fromStation}  ➔  ${passport.toStation}`, 60, 205);

    ctx.font = "18px monospace";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.fillText(
      `Date: ${passport.dateOfJourney}  |  Class: ${passport.travelClass}  |  Quota: ${passport.quota}`,
      60,
      238,
    );

    // 8. Passenger Seats & Confirmation Box
    const boxY = 275;
    const boxHeight = 220;
    ctx.fillStyle = isDark ? "rgba(30, 27, 75, 0.6)" : "#ffffff";
    ctx.strokeStyle = isDark ? "#3730a3" : "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.roundRect(60, boxY, 1080, boxHeight, 20);
    ctx.fill();
    ctx.stroke();

    passport.passengers.slice(0, 3).forEach((p, idx) => {
      const rowY = boxY + 45 + idx * 55;
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.fillText(`Passenger ${p.number}:`, 85, rowY);

      // Status pill text
      const isCnf = p.currentStatus.toUpperCase().includes("CNF");
      ctx.fillStyle = isCnf
        ? isDark
          ? "#34d399"
          : "#059669"
        : isDark
          ? "#fbbf24"
          : "#d97706";
      ctx.font = "bold 20px sans-serif";
      const seatText =
        isCnf && p.coach
          ? `CNF (Coach ${p.coach} / Berth ${p.berth} - ${p.berthType})`
          : p.currentStatus;
      ctx.fillText(seatText, 240, rowY);

      // Platform zone text
      ctx.font = "16px monospace";
      ctx.fillStyle = isDark ? "#cbd5e1" : "#64748b";
      ctx.fillText(`Zone: ${p.platformZone.label}`, 740, rowY);
    });

    // 9. Footer Watermark & Live Link
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
    ctx.fillText(
      `Scan or Visit to Track Live: wayvia.xyz/pnr/${passport.pnr}`,
      60,
      620,
    );

    ctx.font = "16px sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.fillText(
      "Generated on Wayvia • Indian Railways Multimodal Navigator",
      680,
      620,
    );

    // Trigger download
    setTimeout(() => {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Wayvia-Journey-Passport-${passport.pnr}.png`;
      a.click();
      setDownloadingImg(false);
    }, 200);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      {/* HIDDEN CANVAS FOR PNG EXPORT */}
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER */}
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          <Sparkles size={13} />
          1-Click WhatsApp Live Journey Passport
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          Share Your Train Journey with Family in Style
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
          No more ugly screenshots or confusing SMS forwards. Turn your IRCTC
          PNR into an aesthetic digital boarding pass with live confirmation
          odds, platform coach stop indicators, and 1-click WhatsApp group
          sharing.
        </p>

        {/* VERIFIED SAMPLE PRESETS */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            Try Demo Trains:
          </span>
          {VERIFIED_SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.pnr}
              onClick={() => handlePresetSelect(preset.data)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs transition-all hover:border-violet hover:bg-surface-alt active:scale-98"
            >
              <span>{preset.title}</span>
              <span className="rounded-md bg-surface-alt px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* PNR SEARCH INPUT FORM */}
      <section className="mx-auto mt-8 max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPnr(pnrInput);
          }}
          className="flex gap-2"
        >
          <input
            value={pnrInput}
            onChange={(e) =>
              setPnrInput(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="Enter 10-digit PNR number"
            inputMode="numeric"
            autoComplete="off"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 font-mono text-sm tracking-wide text-ink outline-none transition-colors focus:border-violet focus:ring-4 focus:ring-violet-ring shadow-xs"
          />
          <button
            type="submit"
            disabled={loading || pnrInput.length !== 10}
            className="shrink-0 rounded-2xl bg-violet px-6 py-3 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-dark disabled:opacity-50"
          >
            {loading ? "Fetching Erail…" : "Generate Card"}
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {error}
          </div>
        )}
      </section>

      {/* THE LIVE JOURNEY PASSPORT CARD */}
      <section className="mt-10">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Card Preview
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* THEME TOGGLE */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-alt p-1 text-[11px] font-semibold">
            <button
              onClick={() => setCardTheme("dark")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                cardTheme === "dark"
                  ? "bg-white text-ink shadow-2xs font-bold"
                  : "text-ink-muted"
              }`}
            >
              🌙 Royal Navy
            </button>
            <button
              onClick={() => setCardTheme("light")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                cardTheme === "light"
                  ? "bg-white text-ink shadow-2xs font-bold"
                  : "text-ink-muted"
              }`}
            >
              ☀️ Clean Light
            </button>
          </div>
        </div>

        {/* CARD CONTAINER */}
        <div
          className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl ${
            cardTheme === "dark"
              ? "border-indigo-900/50 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white"
              : "border-border bg-gradient-to-br from-white via-surface-alt to-indigo-50/40 text-ink"
          }`}
        >
          {/* TOP ACCENT BADGE BAR */}
          <div
            className={`flex flex-wrap items-center justify-between border-b px-6 py-4 text-xs ${
              cardTheme === "dark"
                ? "border-white/10 bg-white/5"
                : "border-border bg-white"
            }`}
          >
            <div className="flex items-center gap-2 font-mono font-bold">
              <Train size={16} className="text-violet" />
              <span>WAYVIA LIVE RAILWAY PASSPORT</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold ${
                  passport.primaryStatus === "CNF"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : passport.primaryStatus === "RAC"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {passport.overallConfirmationScore}% Confirmation Odds
              </span>
              <span className="font-mono text-[11px] text-ink-dim">
                PNR {passport.pnr}
              </span>
            </div>
          </div>

          {/* MAIN BOARDING PASS BODY */}
          <div className="p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-12 md:items-center">
              {/* TRAIN & ROUTE INFO (8 Cols) */}
              <div className="space-y-4 md:col-span-8">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-violet font-semibold">
                    {passport.chartStatus}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {passport.trainNumber} {passport.trainName}
                  </h2>
                </div>

                {/* FROM / TO ROUTE GRAPHIC */}
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-display text-xl font-bold sm:text-2xl">
                      {passport.fromStation}
                    </div>
                    <div className="font-mono text-[11px] opacity-70">
                      Boarding Point
                    </div>
                  </div>

                  <div className="flex flex-1 items-center px-2">
                    <div className="h-0.5 w-full bg-violet/40" />
                    <Train size={16} className="text-violet shrink-0 mx-1" />
                    <div className="h-0.5 w-full bg-violet/40" />
                  </div>

                  <div className="text-right">
                    <div className="font-display text-xl font-bold sm:text-2xl">
                      {passport.toStation}
                    </div>
                    <div className="font-mono text-[11px] opacity-70">
                      Destination
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-mono opacity-80 border-t border-white/10 pt-3">
                  <div>
                    📅 Date:{" "}
                    <strong className="opacity-100">
                      {passport.dateOfJourney}
                    </strong>
                  </div>
                  <div>
                    🛋️ Class:{" "}
                    <strong className="opacity-100">
                      {passport.travelClass}
                    </strong>
                  </div>
                  <div>
                    🎫 Quota:{" "}
                    <strong className="opacity-100">{passport.quota}</strong>
                  </div>
                </div>
              </div>

              {/* QR CODE & PLATFORM ZONE SIDEBAR (4 Cols) */}
              <div
                className={`rounded-2xl border p-4 text-center md:col-span-4 ${
                  cardTheme === "dark"
                    ? "border-white/10 bg-white/5"
                    : "border-border bg-white"
                }`}
              >
                <div className="flex justify-center">
                  <div className="rounded-xl bg-white p-2.5 shadow-sm">
                    <QrCode size={64} className="text-black" />
                  </div>
                </div>
                <div className="mt-2.5 font-mono text-[11px] font-bold text-violet">
                  PLATFORM STOPPING ZONE
                </div>
                <div className="mt-1 font-display text-xs font-semibold">
                  {passport.passengers[0]?.platformZone.label ||
                    "Platform Center"}
                </div>
                <div className="mt-1 text-[10.5px] opacity-70 line-clamp-2">
                  {passport.passengers[0]?.platformZone.description}
                </div>
              </div>
            </div>

            {/* PASSENGERS LIST SECTION */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="font-mono text-xs uppercase tracking-wider opacity-70">
                Allotted Seats &amp; Berths ({passport.passengers.length}{" "}
                Passenger{passport.passengers.length > 1 ? "s" : ""})
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {passport.passengers.map((p) => {
                  const isCnf = p.currentStatus.toUpperCase().includes("CNF");
                  return (
                    <div
                      key={p.number}
                      className={`flex items-center justify-between rounded-2xl border p-3.5 ${
                        cardTheme === "dark"
                          ? "border-white/10 bg-white/5"
                          : "border-border bg-white"
                      }`}
                    >
                      <div>
                        <div className="font-display text-xs font-bold">
                          Passenger {p.number}
                        </div>
                        <div className="mt-0.5 font-mono text-xs">
                          {isCnf && p.coach ? (
                            <span className="font-bold text-emerald-400">
                              Coach {p.coach} · Berth {p.berth} ({p.berthType})
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold">
                              {p.currentStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                          isCnf
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {p.confirmationProbability.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD FOOTER WITH URL & WATERMARK */}
          <div
            className={`flex items-center justify-between border-t px-6 py-3 text-[11px] font-mono ${
              cardTheme === "dark"
                ? "border-white/10 bg-white/5 opacity-70"
                : "border-border bg-white text-ink-muted"
            }`}
          >
            <span>Live URL: wayvia.xyz/pnr/{passport.pnr}</span>
            <span>Scan to View Status Live Without App</span>
          </div>
        </div>

        {/* 1-CLICK ACTION COMMAND BAR */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* PRIMARY: WHATSAPP SHARE */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 font-display text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all"
          >
            <Share2 size={16} />
            Share to WhatsApp Family Group
          </button>

          {/* SECONDARY: COPY FORMATTED TEXT */}
          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 rounded-2xl border border-border bg-white px-5 py-3.5 font-display text-sm font-semibold text-ink shadow-xs hover:border-violet hover:bg-surface-alt active:scale-98 transition-all"
          >
            {copiedText ? (
              <>
                <Check size={16} className="text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="text-violet" />
                Copy WhatsApp Text
              </>
            )}
          </button>

          {/* TERTIARY: DOWNLOAD PNG BOARDING PASS */}
          <button
            onClick={handleDownloadPng}
            disabled={downloadingImg}
            className="flex items-center gap-2 rounded-2xl border border-border bg-white px-5 py-3.5 font-display text-sm font-semibold text-ink shadow-xs hover:border-violet hover:bg-surface-alt active:scale-98 transition-all disabled:opacity-50"
          >
            <Download size={16} className="text-violet" />
            {downloadingImg ? "Generating PNG…" : "Download Image Card"}
          </button>
        </div>

        {/* FAILOVER PLAN B NOTICE IF WAITLISTED */}
        {passport.primaryStatus !== "CNF" && (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="font-display text-sm font-bold text-amber-900">
                    Ticket is in Waitlist — Need a Guaranteed Plan B?
                  </h4>
                  <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                    Don&apos;t get stranded if chart preparation doesn&apos;t
                    confirm your berth. Wayvia can synthesize connecting train +
                    luxury expressway bus alternatives.
                  </p>
                </div>
              </div>

              <Link
                href={`/journey-planner?from=${passport.fromStation}&to=${passport.toStation}`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 font-display text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors"
              >
                <Compass size={13} />
                Find Guaranteed Backup Routes →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* VIRAL ADVANTAGE EXPLAINER */}
      <section className="mt-16 rounded-3xl border border-border bg-surface-alt/60 p-6 sm:p-8">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet font-semibold">
            Why Travelers Love Journey Passport
          </div>
          <h3 className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
            Never Answer &quot;Train Kahan Ruki?&quot; Again
          </h3>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="font-mono text-xs font-bold text-violet">
              01 • Family Peace of Mind
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              1-Tap WhatsApp Group Updates
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Sends an aesthetic formatted summary with live train number, berth
              details, and confirmed odds directly to family chats.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="font-mono text-xs font-bold text-violet">
              02 • Zero Luggage Panic
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              Platform Escalator Guidance
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Shows whether your coach stops near the front engine, platform
              center escalators, or rear guard van so family waits in the right
              zone.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="font-mono text-xs font-bold text-violet">
              03 • No App Install Required
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              Public Shareable Link
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Anyone clicking the WhatsApp link sees the live journey card
              instantly in their browser with zero sign-ups or downloads.
            </p>
          </div>
        </div>
      </section>

      {/* RELATED GUIDES */}
      <RelatedBlogGuides
        title="PNR Confirmation & Seat Map Guides"
        subtitle="Master Indian Railways confirmation prediction, berth layouts, and coach indicators."
        guides={[
          {
            slug: "pnr-status-explained-cnf-rac-wl-meaning",
            title:
              "PNR Status Codes Explained (2026): CNF, RAC, WL & Coach Meaning",
            excerpt:
              "Learn what your PNR allotment details mean, how waitlist numbers work, and confirmation rules.",
            category: "Tips",
            readTime: "8 min read",
          },
          {
            slug: "irctc-coach-position-seat-map-guide-2026",
            title: "IRCTC Coach Position & Seat Map Blueprint Guide (2026)",
            excerpt:
              "How Indian Railways orders 24 coaches, how platform escalator zones work, and 3E side middle layout.",
            category: "Rail",
            readTime: "9 min read",
          },
          {
            slug: "ultimate-split-ticketing-guide-irctc",
            title:
              "The Ultimate Guide to IRCTC Split Ticketing: Find Hidden Seats",
            excerpt:
              "How to legally unlock confirmed berths on sold-out trains by splitting your booking across stations.",
            category: "Tips",
            readTime: "11 min read",
          },
        ]}
      />
    </main>
  );
}
