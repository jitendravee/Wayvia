"use client";

import React, { useMemo } from "react";
import { Bus, Plane, Train, Sparkles, Check } from "lucide-react";
import { DEFAULT_HUBS } from "@/lib/graph/hubs";

export interface ProgressStep {
  id: string;
  title: string;
  defaultDetail: string;
}

const STEPS: ProgressStep[] = [
  {
    id: "direct_routes",
    title: "Checking direct routes",
    defaultDetail: "Searching direct trains & express services",
  },
  {
    id: "nearby_connections",
    title: "Checking nearby connections",
    defaultDetail: "Scanning junction nodes for split journeys",
  },
  {
    id: "availability",
    title: "Checking availability",
    defaultDetail: "Querying IRCTC live berths & connecting buses",
  },
  {
    id: "prices",
    title: "Comparing prices",
    defaultDetail: "Evaluating fare splits & comfortable layover times",
  },
  {
    id: "best_combination",
    title: "Finding the best combination",
    defaultDetail: "Optimizing confirmed seats & multimodal routes",
  },
];

const STATION_NAMES: Record<string, string> = {
  NDLS: "New Delhi",
  DLI: "Old Delhi",
  NZM: "Nizamuddin",
  BCT: "Mumbai Central",
  CSMT: "Mumbai CSMT",
  BDTS: "Bandra Terminus",
  PUNE: "Pune",
  SBC: "Bengaluru",
  MAS: "Chennai",
  HWH: "Kolkata",
  SC: "Hyderabad",
  JP: "Jaipur",
  ADI: "Ahmedabad",
  LKO: "Lucknow",
  PNBE: "Patna",
  BBS: "Bhubaneswar",
  GHY: "Guwahati",
  TVC: "Thiruvananthapuram",
  ERS: "Kochi",
  MAO: "Goa",
  ASR: "Amritsar",
  CDG: "Chandigarh",
  DDN: "Dehradun",
  JU: "Jodhpur",
  UDZ: "Udaipur",
  INDB: "Indore",
  BPL: "Bhopal",
  NGP: "Nagpur",
  KOTA: "Kota",
  BRC: "Vadodara",
  ST: "Surat",
  RTM: "Ratlam",
  CNB: "Kanpur",
  BSB: "Varanasi",
};

function formatStationName(raw: string): string {
  if (!raw) return "Station";
  const upper = raw.toUpperCase().trim();
  if (STATION_NAMES[upper]) return STATION_NAMES[upper];
  for (const h of DEFAULT_HUBS) {
    if (h.code === upper) return h.name.split(" ")[0];
  }
  return raw
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function SearchProgressLoader({
  from,
  to,
  currentStep = 0,
  liveDetail,
  hubs,
}: {
  from: string;
  to: string;
  currentStep?: number;
  liveDetail?: string;
  hubs?: string[];
}) {
  const originName = useMemo(() => formatStationName(from), [from]);
  const destName = useMemo(() => formatStationName(to), [to]);

  return (
    <div className="w-full max-w-md mx-auto my-6 px-4 select-none">
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-100/90 pt-7 pb-0 transition-all">
        {/* Brand Header matching screenshot with real logo.png */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Wayvia"
              className="h-7 w-7 rounded-lg object-contain"
            />
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              Wayvia
            </span>
          </div>
        </div>

        {/* Central Orbital Graphic matching screenshot */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center my-2">
          {/* Outer Dashed Orbit Track */}
          <div className="absolute inset-2 rounded-full border border-dashed border-blue-200/70 animate-spin-slow pointer-events-none" />

          {/* Inner Dashed Orbit Track */}
          <div className="absolute inset-10 rounded-full border border-dashed border-indigo-200/60 pointer-events-none" />

          {/* Orbiting Badge 1: Bus (Top-Left) */}
          <div className="absolute top-4 left-6 z-10 animate-bounce-gentle">
            <div className="w-10 h-10 rounded-full bg-white shadow-md border border-blue-100 flex items-center justify-center text-blue-600 transition-transform hover:scale-110">
              <Bus size={18} strokeWidth={2.2} />
            </div>
          </div>

          {/* Orbiting Badge 2: Flight (Right) */}
          <div className="absolute top-12 right-4 z-10 animate-pulse-gentle">
            <div className="w-10 h-10 rounded-full bg-white shadow-md border border-purple-100 flex items-center justify-center text-purple-600 transition-transform hover:scale-110">
              <Plane size={18} strokeWidth={2.2} />
            </div>
          </div>

          {/* Orbiting Badge 3: Connecting Train/Bus (Bottom) */}
          <div className="absolute bottom-2 left-20 z-10 animate-float-gentle">
            <div className="w-10 h-10 rounded-full bg-white shadow-md border border-indigo-100 flex items-center justify-center text-indigo-600 transition-transform hover:scale-110">
              <Train size={18} strokeWidth={2.2} />
            </div>
          </div>

          {/* Glowing Center Core with Wayvia logo.png */}
          <div className="relative z-20 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/15 to-blue-600/10 backdrop-blur-md shadow-inner border border-blue-100/80 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden p-2.5">
              <img
                src="/logo.png"
                alt="Wayvia"
                className="w-full h-full object-contain animate-pulse"
              />
            </div>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center px-4 mt-2 mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Finding your way...
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Checking trains, buses, flights and connections
          </p>
        </div>

        {/* Route Progress Strip matching screenshot */}
        <div className="flex items-center justify-center gap-2 px-6 mb-7">
          <span className="font-medium text-[12.5px] text-slate-700 truncate max-w-[100px]">
            {originName}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0" />
          <div className="h-[2px] w-12 sm:w-16 border-b-2 border-dotted border-blue-400/80 shrink-0" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-xs flex items-center justify-center text-blue-600 shrink-0 animate-pulse">
            <Sparkles size={14} />
          </div>
          <div className="h-[2px] w-12 sm:w-16 border-b-2 border-dotted border-purple-400/80 shrink-0" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-purple-100 shrink-0" />
          <span className="font-medium text-[12.5px] text-slate-700 truncate max-w-[100px]">
            {destName}
          </span>
        </div>

        {/* Progressive Realtime Checklist matching screenshot */}
        <div className="space-y-3.5 px-6 sm:px-8 mb-8">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;
            const isPending = currentStep < idx;

            let detail = step.defaultDetail;
            if (isCurrent && liveDetail) {
              detail = liveDetail;
            } else if (
              step.id === "nearby_connections" &&
              hubs &&
              hubs.length > 0
            ) {
              detail = `Scanning ${hubs.length} junctions (${hubs.slice(0, 4).join(", ")}...)`;
            }

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 transition-opacity duration-300 ${
                  isPending ? "opacity-50" : "opacity-100"
                }`}
              >
                {/* Step Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 ring-4 ring-blue-150 animate-pulse flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white" />
                  )}
                </div>

                {/* Step Text & Realtime Details */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[13px] leading-tight ${
                      isCurrent
                        ? "font-bold text-slate-900"
                        : isCompleted
                          ? "font-medium text-slate-800"
                          : "font-normal text-slate-500"
                    }`}
                  >
                    {step.title}
                  </div>
                  {(isCurrent || isCompleted) && (
                    <div
                      className={`text-[11px] mt-0.5 leading-snug transition-all ${
                        isCurrent
                          ? "text-blue-600 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ambient Decorative Pastel Waves matching bottom of screenshot */}
        <div className="w-full h-14 overflow-hidden relative pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-100/40 via-purple-100/30 to-transparent" />
          <svg
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
            className="w-full h-full opacity-60 text-blue-200"
          >
            <path
              d="M0 25 C100 45, 180 5, 270 30 C340 50, 380 20, 400 35 L400 60 L0 60 Z"
              fill="currentColor"
            />
          </svg>
          <svg
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-full opacity-50 text-purple-200"
          >
            <path
              d="M0 40 C90 15, 190 45, 300 25 C360 10, 390 35, 400 30 L400 60 L0 60 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 24s linear infinite;
        }

        @keyframes bounceGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-gentle {
          animation: bounceGentle 3s ease-in-out infinite;
        }

        @keyframes pulseGentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-gentle {
          animation: pulseGentle 2.5s ease-in-out infinite;
        }

        @keyframes floatGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        .animate-float-gentle {
          animation: floatGentle 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
