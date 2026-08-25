"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

interface Destination {
  id: string;
  from: { name: string; code: string };
  to: { name: string; code: string };
  ways: number;
  image: string;
}

const DESTINATIONS: Destination[] = [
  {
    id: "delhi-mumbai",
    from: { name: "Delhi", code: "NDLS" },
    to: { name: "Mumbai", code: "BCT" },
    ways: 12,
    image:
      "https://imgs.search.brave.com/rPVwe70RLG4zPQ9vwgz5vk5bWJ_2M0yJE3Ld6NH7pCQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzIwLzYyLzgxLzAx/LzM2MF9GXzIwNjI4/MTAxMjJfMkh3R3RT/Yjc0NU9SVHp2QlNu/Q0N1dzYyT1UyaGxx/NVguanBn",
  },
  {
    id: "bengaluru-chennai",
    from: { name: "Bengaluru", code: "SBC" },
    to: { name: "Chennai", code: "MAS" },
    ways: 8,
    image: "https://i.12go.co/images/upload-media/4269.jpeg",
  },
  {
    id: "mumbai-goa",
    from: { name: "Mumbai", code: "BCT" },
    to: { name: "Goa", code: "MAO" },
    ways: 10,
    image:
      "https://www.petitfute.com/medias/mag/41439/originale/AdobeStock_200559473-1024x683.jpeg",
  },
  {
    id: "delhi-jaipur",
    from: { name: "Delhi", code: "NDLS" },
    to: { name: "Jaipur", code: "JP" },
    ways: 6,
    image:
      "https://cdn.kimkim.com/files/a/article_images/images/abe4f0d4c160637f0970927eaf6784cbe978cd8b/big-eddab41efc8e79a21b66796882811240.jpg",
  },
  {
    id: "pune-goa",
    from: { name: "Pune", code: "PUNE" },
    to: { name: "Goa", code: "MAO" },
    ways: 7,
    image:
      "https://www.asiaodysseytravel.com/images/asia-tours/india-tours/goa-basilica-of-bom-jesus-700-1.jpg",
  },
  {
    id: "delhi-agra",
    from: { name: "Delhi", code: "NDLS" },
    to: { name: "Agra", code: "AGC" },
    ways: 5,
    image:
      "https://lp-cms-production.imgix.net/2024-12/shutterstockRF122394565.jpg?auto=format%2Ccompress&fit=crop&q=72",
  },
  {
    id: "delhi-kolkata",
    from: { name: "Delhi", code: "NDLS" },
    to: { name: "Kolkata", code: "HWH" },
    ways: 9,
    image: "https://picsum.photos/seed/wayvia-kolkata/600/800",
  },
  {
    id: "hyderabad-bengaluru",
    from: { name: "Hyderabad", code: "SC" },
    to: { name: "Bengaluru", code: "SBC" },
    ways: 6,
    image: "https://picsum.photos/seed/wayvia-hyderabad/600/800",
  },
  {
    id: "chennai-kochi",
    from: { name: "Chennai", code: "MAS" },
    to: { name: "Kochi", code: "ERS" },
    ways: 7,
    image: "https://picsum.photos/seed/wayvia-kochi/600/800",
  },
  {
    id: "delhi-shimla",
    from: { name: "Delhi", code: "NDLS" },
    to: { name: "Shimla", code: "SML" },
    ways: 4,
    image: "https://picsum.photos/seed/wayvia-shimla/600/800",
  },
  {
    id: "ahmedabad-udaipur",
    from: { name: "Ahmedabad", code: "ADI" },
    to: { name: "Udaipur", code: "UDZ" },
    ways: 5,
    image: "https://picsum.photos/seed/wayvia-udaipur/600/800",
  },
  {
    id: "varanasi-delhi",
    from: { name: "Varanasi", code: "BSB" },
    to: { name: "Delhi", code: "NDLS" },
    ways: 8,
    image: "https://picsum.photos/seed/wayvia-varanasi/600/800",
  },
];

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */

function DestinationCard({ dest }: { dest: Destination }) {
  const router = useRouter();

  function handleClick() {
    router.push(`/journey-planner?from=${dest.from.code}&to=${dest.to.code}`);
  }

  return (
    <button
      type="button"
      data-card
      onClick={handleClick}
      className="group relative aspect-[3/4] w-full shrink-0 snap-start overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md sm:w-[68vw] sm:max-w-[240px] lg:w-[260px]"
    >
      <Image
        src={dest.image}
        alt={`${dest.from.name} to ${dest.to.name}`}
        fill
        sizes="(min-width: 1024px) 260px, (min-width: 640px) 220px, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p className="flex flex-wrap items-center gap-x-1.5 font-display text-[14px] font-semibold leading-tight text-white sm:text-[15px]">
          <span>{dest.from.name}</span>
          <ArrowRight size={13} className="shrink-0 text-white/80" />
          <span>{dest.to.name}</span>
        </p>
        <p className="mt-1 font-sans text-[11.5px] text-white/75 sm:text-[12px]">
          {dest.ways} {dest.ways === 1 ? "way" : "ways"}
        </p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel                                                           */
/* ------------------------------------------------------------------ */

const AUTOPLAY_INTERVAL_MS = 4000;
const RESUME_DELAY_MS = 6000;

export default function WhereAreYouGoing() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.offsetWidth : el.clientWidth;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    const delta = cardWidth + gap;
    const maxScroll = el.scrollWidth - el.clientWidth;

    let target = el.scrollLeft + dir * delta;

    isAutoScrolling.current = true;
    if (target > maxScroll - 2) {
      target = 0;
    } else if (target < 2) {
      target = maxScroll;
    }
    el.scrollTo({ left: target, behavior: "smooth" });
    window.setTimeout(() => {
      isAutoScrolling.current = false;
    }, 500);
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;
    autoplayTimer.current = setInterval(() => step(1), AUTOPLAY_INTERVAL_MS);
  }, [step, stopAutoplay]);

  const handleManualInteraction = useCallback(() => {
    stopAutoplay();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(startAutoplay, RESUME_DELAY_MS);
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => {
      stopAutoplay();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [startAutoplay, stopAutoplay]);

  function handleArrowClick(dir: 1 | -1) {
    step(dir);
    handleManualInteraction();
  }

  function handleUserScroll() {
    if (isAutoScrolling.current) return;
    handleManualInteraction();
  }

  return (
    <section className=" pl-6  lg:px-8 lg:pr-0">
      <h2 className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
        Where are you going?
      </h2>

      <div
        className="relative mt-8 sm:mt-10"
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
      >
        {/* Desktop navigation arrows (overlaid) */}
        <button
          type="button"
          aria-label="Previous destinations"
          onClick={() => handleArrowClick(-1)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 p-2 text-violet shadow-sm backdrop-blur transition hover:bg-white sm:flex sm:-left-2 sm:p-2.5 lg:-left-4"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollerRef}
          onScroll={handleUserScroll}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 sm:px-9 sm:px-10 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
          {DESTINATIONS.map((dest) => (
            <DestinationCard key={dest.id} dest={dest} />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next destinations"
          onClick={() => handleArrowClick(1)}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 p-2 text-violet shadow-sm backdrop-blur transition hover:bg-white sm:flex sm:-right-2 sm:p-2.5 lg:right-4"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Mobile navigation arrows (below carousel) */}
      <div className="mt-4 flex items-center  gap-3 sm:hidden justify-between">
        <button
          type="button"
          aria-label="Previous destinations"
          onClick={() => handleArrowClick(-1)}
          className="flex items-center justify-center rounded-full border border-border bg-white/95 p-2 text-violet shadow-sm transition hover:bg-white"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next destinations"
          onClick={() => handleArrowClick(1)}
          className="flex items-center justify-center rounded-full border border-border bg-white/95 p-2 text-violet shadow-sm transition hover:bg-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}