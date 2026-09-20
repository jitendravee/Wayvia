import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GitFork,
  Clock,
  MapPin,
  Building,
  Coffee,
  Luggage,
  ShieldCheck,
  DoorOpen,
  ArrowRight,
  ExternalLink,
  Train,
  CheckCircle2,
  AlertTriangle,
  Compass,
} from "lucide-react";
import {
  JUNCTIONS_DATA,
  getJunctionBySlug,
  JunctionHubDetail,
} from "@/lib/junctions/junctionData";

export function generateStaticParams() {
  return JUNCTIONS_DATA.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const junc = getJunctionBySlug(slug);
  if (!junc) return {};

  return {
    title: `${junc.name} (${junc.code}) Layover & Transfer Guide — Cloakroom, Lounges & Metro | Wayvia`,
    description: `Complete guide to connecting trains at ${junc.name} (${junc.code}). Minimum connection buffer (${junc.minimumConnectionTimeMin} mins), cloakroom rules, executive lounge access, and inter-station transfers.`,
    keywords: [
      `${junc.code} railway station`,
      `${junc.name} layover`,
      `${junc.code} cloakroom charges`,
      `${junc.code} executive lounge`,
      `connecting train at ${junc.name}`,
      `${junc.code} platform map`,
    ],
    alternates: {
      canonical: `/junctions/${junc.slug}`,
    },
    openGraph: {
      title: `${junc.name} (${junc.code}) Layover & Transfer Guide | Wayvia`,
      description: `Minimum connection time, cloakrooms, executive lounges, and station exits at ${junc.name}.`,
      url: `https://wayvia.xyz/junctions/${junc.slug}`,
      siteName: "Wayvia",
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function JunctionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const junc = getJunctionBySlug(slug);

  if (!junc) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: junc.name,
    identifier: junc.code,
    address: {
      "@type": "PostalAddress",
      addressLocality: junc.city,
      addressRegion: junc.state,
      addressCountry: "IN",
    },
    description: junc.overview,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-2 font-mono text-xs text-ink-muted">
          <Link href="/" className="hover:text-violet transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/junctions"
            className="hover:text-violet transition-colors"
          >
            Junctions
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">{junc.code}</span>
        </nav>

        {/* HERO SECTION */}
        <header className="mt-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded-xl bg-violet px-3 py-1 font-mono text-sm font-extrabold text-white shadow-xs">
                {junc.code}
              </span>
              <span className="rounded-full bg-violet-soft px-3 py-0.5 font-mono text-xs font-semibold text-violet">
                {junc.categoryLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
              <span>{junc.zone}</span>
            </div>
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {junc.name} Layover &amp; Transfer Guide
          </h1>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {junc.city}, {junc.state} • {junc.platformsCount} Operating
            Platforms
          </p>

          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {junc.overview}
          </p>

          {/* KEY METRICS BAR */}
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-surface-alt p-4 sm:grid-cols-4">
            <div>
              <div className="font-mono text-[10px] uppercase text-ink-dim">
                Min Layover Buffer
              </div>
              <div className="font-mono text-sm font-bold text-ink flex items-center gap-1 mt-0.5">
                <Clock size={13} className="text-violet" />
                {junc.minimumConnectionTimeMin} mins
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase text-ink-dim">
                Total Platforms
              </div>
              <div className="font-mono text-sm font-bold text-ink mt-0.5">
                {junc.platformsCount} Platforms
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase text-ink-dim">
                Executive Lounge
              </div>
              <div className="font-mono text-sm font-bold mt-0.5">
                {junc.amenities.hasExecutiveLounge ? (
                  <span className="text-emerald-700">Available (AC)</span>
                ) : (
                  <span className="text-ink-muted">Waiting Hall Only</span>
                )}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase text-ink-dim">
                Cloakroom Tariff
              </div>
              <div className="font-mono text-sm font-bold text-ink mt-0.5">
                ₹{junc.amenities.cloakroomRatePer24hRs} / 24 hrs
              </div>
            </div>
          </div>
        </header>

        {/* STATION PORTALS / ENTRANCE GUIDE */}
        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-violet" />
            <h2 className="font-display text-lg font-bold text-ink">
              Station Entrances &amp; Exit Portals
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            Major Indian junctions have completely different access roads on
            either side. Avoid taxi drop-offs on the wrong side.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4 bg-surface-alt/40">
              <div className="font-display text-sm font-bold text-ink">
                {junc.portals.side1.name}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {junc.portals.side1.description}
              </p>
              <div className="mt-2 text-[11px] font-medium text-violet">
                Best For: {junc.portals.side1.bestFor}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 bg-surface-alt/40">
              <div className="font-display text-sm font-bold text-ink">
                {junc.portals.side2.name}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {junc.portals.side2.description}
              </p>
              <div className="mt-2 text-[11px] font-medium text-violet">
                Best For: {junc.portals.side2.bestFor}
              </div>
            </div>
          </div>
        </section>

        {/* INTER-STATION TERMINAL TRANSFERS (IF APPLICABLE) */}
        {junc.interStationTransfers &&
          junc.interStationTransfers.length > 0 && (
            <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Building size={18} className="text-violet" />
                <h2 className="font-display text-lg font-bold text-ink">
                  City Terminal Transfer Navigator
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                Catching your next train from another terminal in {junc.city}?
                Here is your exact transit route:
              </p>

              <div className="mt-4 space-y-4">
                {junc.interStationTransfers.map((trans) => (
                  <div
                    key={trans.toStationCode}
                    className="rounded-xl border border-violet/20 bg-violet-soft/15 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-violet uppercase">
                          Transfer to:
                        </span>
                        <h3 className="font-display text-base font-bold text-ink">
                          {trans.toStationName} ({trans.toStationCode}) •{" "}
                          {trans.distanceKm} km
                        </h3>
                      </div>

                      <div className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold text-ink border border-border">
                        Buffer Required: {trans.recommendedBufferMin} mins
                      </div>
                    </div>

                    {/* METRO ROUTE */}
                    {trans.metroRoute && (
                      <div className="mt-3 rounded-lg border border-border bg-white p-3 text-xs">
                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2
                            size={13}
                            className="text-emerald-600"
                          />
                          Recommended: Rapid Metro Line (Zero Traffic Risk)
                        </div>
                        <p className="mt-1 text-ink-muted">
                          {trans.metroRoute.lines} • ~
                          {trans.metroRoute.travelTimeMin} mins (₹
                          {trans.metroRoute.fareRs})
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-dim">
                          Nearest Metro Station:{" "}
                          {trans.metroRoute.nearestMetroStation}
                        </p>
                      </div>
                    )}

                    {/* ROAD / CAB ROUTE */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-muted">
                      <div>
                        Taxi (Uber/Ola):{" "}
                        <strong className="text-ink">
                          {trans.roadTransit.taxiFareRs}
                        </strong>
                      </div>
                      <div>•</div>
                      <div>
                        Prepaid Auto:{" "}
                        <strong className="text-ink">
                          {trans.roadTransit.autoFareRs}
                        </strong>
                      </div>
                      <div>•</div>
                      <div>
                        Duration: ~{trans.roadTransit.normalDurationMin}m (Rush
                        hour: ~{trans.roadTransit.rushHourDurationMin}m)
                      </div>
                    </div>

                    {/* PRO TIP */}
                    <div className="mt-2.5 text-xs text-ink-muted">
                      <strong>Transfer Tip:</strong> {trans.transferTip}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* LAYOVER SURVIVAL & AMENITIES CHECKLIST */}
        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Luggage size={18} className="text-violet" />
            <h2 className="font-display text-lg font-bold text-ink">
              Layover Facilities &amp; Cloakroom Rules
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            Essential station services verified against Indian Railways
            guidelines.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* CLOAKROOM */}
            <div className="rounded-xl border border-border p-4">
              <div className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <Luggage size={15} className="text-violet" />
                Cloakroom &amp; Luggage Storage
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                <li>
                  • <strong>Location:</strong>{" "}
                  {junc.amenities.cloakroomLocation}
                </li>
                <li>
                  • <strong>Rate:</strong> ₹
                  {junc.amenities.cloakroomRatePer24hRs} per luggage item per 24
                  hours
                </li>
                <li className="text-signal-red">
                  • <strong>Mandatory Rule:</strong>{" "}
                  {junc.amenities.cloakroomLockRequirement}
                </li>
              </ul>
            </div>

            {/* EXECUTIVE LOUNGE */}
            <div className="rounded-xl border border-border p-4">
              <div className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <Coffee size={15} className="text-violet" />
                Executive Lounge &amp; Waiting Halls
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                <li>
                  • <strong>Lounge:</strong>{" "}
                  {junc.amenities.hasExecutiveLounge
                    ? `Active on ${junc.amenities.loungeLocation} (~₹${junc.amenities.loungeRatePerHourRs}/hr)`
                    : "No private lounge; 24x7 Upper Class AC Waiting Halls available."}
                </li>
                {junc.amenities.loungeAmenities && (
                  <li>
                    • <strong>Includes:</strong>{" "}
                    {junc.amenities.loungeAmenities.join(", ")}
                  </li>
                )}
                <li>
                  • <strong>Night Safety:</strong>{" "}
                  {junc.amenities.safeNightWaitingArea}
                </li>
              </ul>
            </div>

            {/* RETIRING ROOMS */}
            <div className="rounded-xl border border-border p-4">
              <div className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <DoorOpen size={15} className="text-violet" />
                Retiring Rooms &amp; Dormitory
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                AC dormitories and private rooms are available at {junc.name}{" "}
                for travelers holding a confirmed or RAC PNR ticket.
              </p>
              <a
                href={junc.amenities.retiringRooms.bookingPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-violet hover:underline"
              >
                <span>Book Retiring Room on IRCTC</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* FOOD & E-CATERING */}
            <div className="rounded-xl border border-border p-4">
              <div className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <Coffee size={15} className="text-violet" />
                Food, Dining &amp; E-Catering
              </div>
              <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                {junc.amenities.foodHighlights.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
                <li>
                  • Seat delivery available via IRCTC eCatering / Swiggy on
                  platform
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CONNECTING CORRIDORS & WAYVIA SEARCH SHORTCUT */}
        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Train size={18} className="text-violet" />
                Connecting Corridors via {junc.name}
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Key cross-country routes that change trains at {junc.code}:
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {junc.connectingCorridors.map((c) => (
              <div
                key={c.corridorName}
                className="rounded-xl border border-border p-4 flex flex-col justify-between hover:border-violet/40 transition-colors"
              >
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">
                    {c.corridorName}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Key Trains: {c.popularTrains}
                  </p>
                </div>

                <Link
                  href={`/journey-planner?from=${c.searchFrom}&to=${c.searchTo}`}
                  className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-semibold text-violet hover:underline"
                >
                  <span>
                    Search {c.searchFrom} → {c.searchTo} Route on Wayvia
                  </span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
