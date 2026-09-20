/**
 * Indian Railways Coach Layout & Rake Position Engine
 *
 * Provides accurate berth and seat configurations for all major ICF and LHB coaches:
 * - SL (Sleeper - 72 or 80 berths)
 * - 3A (AC 3-Tier - 64 or 72 berths)
 * - 3E (AC 3-Tier Economy - 83 berths with Side Middle)
 * - 2A (AC 2-Tier - 48 or 54 berths)
 * - 1A (First AC - 24 berths in Cabins & Coupes)
 * - CC (AC Chair Car - 73 or 78 seats, 3+2)
 * - EC (Executive Chair Car - 56 seats, 2+2)
 */

export type CoachClassType =
  | "SL"
  | "3A"
  | "3E"
  | "2A"
  | "1A"
  | "CC"
  | "EC"
  | "GEN"
  | "SLR"
  | "PC"
  | "ENG";

export type BerthCode =
  | "LB" // Lower Berth
  | "MB" // Middle Berth
  | "UB" // Upper Berth
  | "SL" // Side Lower
  | "SU" // Side Upper
  | "SM" // Side Middle (3E)
  | "WS" // Window Seat (CC / EC)
  | "MS" // Middle Seat (CC)
  | "AS"; // Aisle Seat (CC / EC)

export interface SeatInfo {
  seatNo: number;
  berthCode: BerthCode;
  berthLabel: string;
  bayNo: number;
  isWindow: boolean;
  isAisle: boolean;
  isRestroomProximity: boolean;
  isEmergencyWindow: boolean;
}

export interface CoachDefinition {
  classType: CoachClassType;
  className: string;
  totalSeats: number;
  baysCount: number;
  seats: SeatInfo[];
  description: string;
  badgeColor: string;
}

export interface CoachInRake {
  positionIndex: number; // 1-indexed from engine
  coachCode: string; // e.g. "B4", "S2", "A1", "GEN", "PC", "ENG"
  classType: CoachClassType;
  platformZone: "FRONT" | "CENTER" | "REAR";
  platformZoneLabel: string;
  nearEscalator: boolean;
}

export interface TrainRakeProfile {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  totalCoaches: number;
  coaches: CoachInRake[];
}

/**
 * Returns the human-readable label and styling for a berth code.
 */
export const BERTH_CONFIG: Record<
  BerthCode,
  { label: string; shortLabel: string; style: string; badge: string }
> = {
  LB: {
    label: "Lower Berth",
    shortLabel: "Lower",
    style: "bg-signal-green-soft text-signal-green border-signal-green/30",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  MB: {
    label: "Middle Berth",
    shortLabel: "Middle",
    style: "bg-signal-amber-soft text-signal-amber border-signal-amber/30",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  UB: {
    label: "Upper Berth",
    shortLabel: "Upper",
    style: "bg-violet-soft text-violet-dark border-violet/30",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  SL: {
    label: "Side Lower",
    shortLabel: "Side Low",
    style: "bg-sky-50 text-sky-700 border-sky-200",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  SU: {
    label: "Side Upper",
    shortLabel: "Side Up",
    style: "bg-teal-50 text-teal-700 border-teal-200",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
  },
  SM: {
    label: "Side Middle",
    shortLabel: "Side Mid",
    style: "bg-cyan-50 text-cyan-700 border-cyan-200",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  WS: {
    label: "Window Seat",
    shortLabel: "Window",
    style: "bg-signal-green-soft text-signal-green border-signal-green/30",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  MS: {
    label: "Middle Seat",
    shortLabel: "Middle",
    style: "bg-signal-amber-soft text-signal-amber border-signal-amber/30",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  AS: {
    label: "Aisle Seat",
    shortLabel: "Aisle",
    style: "bg-surface-alt text-ink-muted border-border",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

/**
 * Derives coach class type from coach identifier (e.g. "B4" -> "3A", "S3" -> "SL", "A1" -> "2A", "M2" -> "3E")
 */
export function classifyCoachCode(code: string): CoachClassType {
  const clean = code.trim().toUpperCase();
  if (clean === "ENG" || clean === "LOCO") return "ENG";
  if (clean.startsWith("SLR") || clean === "EOG" || clean.startsWith("DL")) return "SLR";
  if (clean.startsWith("GS") || clean === "GEN" || clean.startsWith("UR") || clean.startsWith("D")) {
    // If Chair Car like D1 in Jan Shatabdi, or GS in Express
    if (clean.startsWith("D") && !clean.startsWith("DL")) return "CC";
    return "GEN";
  }
  if (clean.startsWith("PC") || clean === "PANTRY") return "PC";
  if (clean.startsWith("H") && !clean.startsWith("HA")) return "1A";
  if (clean.startsWith("HA")) return "2A"; // Composite 1A + 2A
  if (clean.startsWith("A")) return "2A";
  if (clean.startsWith("B")) return "3A";
  if (clean.startsWith("M")) return "3E";
  if (clean.startsWith("S")) return "SL";
  if (clean.startsWith("C")) return "CC";
  if (clean.startsWith("E")) return "EC";
  return "3A"; // default fallback
}

/**
 * Generates the full seat layout for a given coach class.
 */
export function getCoachLayout(coachClass: CoachClassType): CoachDefinition {
  switch (coachClass) {
    case "SL":
      return buildSleeperLayout(72);
    case "3A":
      return buildAc3TierLayout(64);
    case "3E":
      return buildAc3EconomyLayout(83);
    case "2A":
      return buildAc2TierLayout(54);
    case "1A":
      return buildFirstAcLayout(24);
    case "CC":
      return buildChairCarLayout(73);
    case "EC":
      return buildExecutiveChairCarLayout(56);
    default:
      return buildAc3TierLayout(64);
  }
}

/**
 * Builds 72-berth Sleeper Coach layout (9 bays of 8 berths).
 */
function buildSleeperLayout(totalSeats = 72): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = Math.ceil(totalSeats / 8);

  for (let s = 1; s <= totalSeats; s++) {
    const bayNo = Math.floor((s - 1) / 8) + 1;
    const pos = ((s - 1) % 8) + 1;
    let code: BerthCode = "LB";

    if (pos === 1 || pos === 4) code = "LB";
    else if (pos === 2 || pos === 5) code = "MB";
    else if (pos === 3 || pos === 6) code = "UB";
    else if (pos === 7) code = "SL";
    else if (pos === 8) code = "SU";

    const isWindow = pos === 1 || pos === 4 || pos === 7;
    const isAisle = pos === 3 || pos === 6;
    const isRestroomProximity = s <= 4 || s >= totalSeats - 3;
    const isEmergencyWindow = (s >= 17 && s <= 24) || (s >= 41 && s <= 48);

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow,
      isAisle,
      isRestroomProximity,
      isEmergencyWindow,
    });
  }

  return {
    classType: "SL",
    className: "Sleeper Class (SL)",
    totalSeats,
    baysCount,
    seats,
    description: "Standard non-AC sleeper coach with 8-berth bays (6 main + 2 side berths).",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  };
}

/**
 * Builds 64-berth AC 3-Tier Layout (8 bays of 8 berths).
 */
function buildAc3TierLayout(totalSeats = 64): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = Math.ceil(totalSeats / 8);

  for (let s = 1; s <= totalSeats; s++) {
    const bayNo = Math.floor((s - 1) / 8) + 1;
    const pos = ((s - 1) % 8) + 1;
    let code: BerthCode = "LB";

    if (pos === 1 || pos === 4) code = "LB";
    else if (pos === 2 || pos === 5) code = "MB";
    else if (pos === 3 || pos === 6) code = "UB";
    else if (pos === 7) code = "SL";
    else if (pos === 8) code = "SU";

    const isWindow = pos === 1 || pos === 4 || pos === 7;
    const isAisle = pos === 3 || pos === 6;
    const isRestroomProximity = s <= 4 || s >= totalSeats - 3;
    const isEmergencyWindow = (s >= 17 && s <= 24) || (s >= 41 && s <= 48);

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow,
      isAisle,
      isRestroomProximity,
      isEmergencyWindow,
    });
  }

  return {
    classType: "3A",
    className: "AC 3-Tier (3A)",
    totalSeats,
    baysCount,
    seats,
    description: "Air-conditioned 3-tier sleeper with 8-berth bays, linen, and reading lights.",
    badgeColor: "bg-violet-soft text-violet-dark border-violet/40",
  };
}

/**
 * Builds 83-berth AC 3-Economy Layout (3E with Side Middle SM).
 */
function buildAc3EconomyLayout(totalSeats = 83): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = Math.ceil(totalSeats / 9);

  for (let s = 1; s <= totalSeats; s++) {
    const bayNo = Math.floor((s - 1) / 9) + 1;
    const pos = ((s - 1) % 9) + 1;
    let code: BerthCode = "LB";

    if (pos === 1 || pos === 4) code = "LB";
    else if (pos === 2 || pos === 5) code = "MB";
    else if (pos === 3 || pos === 6) code = "UB";
    else if (pos === 7) code = "SL";
    else if (pos === 8) code = "SM"; // Side Middle
    else if (pos === 9) code = "SU";

    const isWindow = pos === 1 || pos === 4 || pos === 7;
    const isAisle = pos === 3 || pos === 6;
    const isRestroomProximity = s <= 4 || s >= totalSeats - 3;
    const isEmergencyWindow = s >= 19 && s <= 27;

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow,
      isAisle,
      isRestroomProximity,
      isEmergencyWindow,
    });
  }

  return {
    classType: "3E",
    className: "AC 3-Economy (3E)",
    totalSeats,
    baysCount,
    seats,
    description: "Modern high-capacity AC 3-tier featuring dedicated AC vents per berth and side-middle berths.",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
  };
}

/**
 * Builds 54-berth AC 2-Tier Layout (6 berths per bay: no middle berths).
 */
function buildAc2TierLayout(totalSeats = 54): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = Math.ceil(totalSeats / 6);

  for (let s = 1; s <= totalSeats; s++) {
    const bayNo = Math.floor((s - 1) / 6) + 1;
    const pos = ((s - 1) % 6) + 1;
    let code: BerthCode = "LB";

    if (pos === 1 || pos === 3) code = "LB";
    else if (pos === 2 || pos === 4) code = "UB";
    else if (pos === 5) code = "SL";
    else if (pos === 6) code = "SU";

    const isWindow = pos === 1 || pos === 3 || pos === 5;
    const isAisle = pos === 2 || pos === 4;
    const isRestroomProximity = s <= 3 || s >= totalSeats - 2;
    const isEmergencyWindow = s >= 13 && s <= 18;

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow,
      isAisle,
      isRestroomProximity,
      isEmergencyWindow,
    });
  }

  return {
    classType: "2A",
    className: "AC 2-Tier (2A)",
    totalSeats,
    baysCount,
    seats,
    description: "Spacious two-tier air-conditioned coach with no middle berths, curtains, and wide windows.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
}

/**
 * Builds First AC (1A) Layout (24 berths: Cabins of 4 + Coupes of 2).
 */
function buildFirstAcLayout(totalSeats = 24): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = 6; // 4 cabins (16 berths) + 2 coupes (4 berths)

  for (let s = 1; s <= totalSeats; s++) {
    const isLower = s % 2 !== 0;
    const code: BerthCode = isLower ? "LB" : "UB";
    const bayNo = Math.floor((s - 1) / 4) + 1;

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow: true,
      isAisle: false,
      isRestroomProximity: s <= 2 || s >= totalSeats - 1,
      isEmergencyWindow: false,
    });
  }

  return {
    classType: "1A",
    className: "First AC (1A)",
    totalSeats,
    baysCount,
    seats,
    description: "Premier private cabins (4 berths) and coupes (2 berths) with lockable sliding doors.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  };
}

/**
 * Builds 73-seat AC Chair Car (CC) (3 + 2 seating across central aisle).
 */
function buildChairCarLayout(totalSeats = 73): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = Math.ceil(totalSeats / 5);

  for (let s = 1; s <= totalSeats; s++) {
    const bayNo = Math.floor((s - 1) / 5) + 1;
    const pos = ((s - 1) % 5) + 1;
    let code: BerthCode = "WS";

    if (pos === 1 || pos === 5) code = "WS"; // Window
    else if (pos === 2) code = "MS"; // Middle
    else if (pos === 3 || pos === 4) code = "AS"; // Aisle

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow: code === "WS",
      isAisle: code === "AS",
      isRestroomProximity: s <= 5 || s >= totalSeats - 4,
      isEmergencyWindow: s >= 26 && s <= 35,
    });
  }

  return {
    classType: "CC",
    className: "AC Chair Car (CC)",
    totalSeats,
    baysCount,
    seats,
    description: "Reclining ergonomic 3+2 seating used on Shatabdi, Jan Shatabdi, and Intercity trains.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  };
}

/**
 * Builds 56-seat Executive Chair Car (EC) (2 + 2 seating).
 */
function buildExecutiveChairCarLayout(totalSeats = 56): CoachDefinition {
  const seats: SeatInfo[] = [];
  const baysCount = Math.ceil(totalSeats / 4);

  for (let s = 1; s <= totalSeats; s++) {
    const bayNo = Math.floor((s - 1) / 4) + 1;
    const pos = ((s - 1) % 4) + 1;
    let code: BerthCode = "WS";

    if (pos === 1 || pos === 4) code = "WS"; // Window
    else code = "AS"; // Aisle

    seats.push({
      seatNo: s,
      berthCode: code,
      berthLabel: BERTH_CONFIG[code].label,
      bayNo,
      isWindow: code === "WS",
      isAisle: code === "AS",
      isRestroomProximity: s <= 4 || s >= totalSeats - 3,
      isEmergencyWindow: false,
    });
  }

  return {
    classType: "EC",
    className: "Executive Chair Car (EC)",
    totalSeats,
    baysCount,
    seats,
    description: "Luxury 2+2 spacious seating with extended legroom and footrests on Shatabdi & Vande Bharat.",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
  };
}

/**
 * Generates platform position indicators for a coach in a 22-coach train.
 */
export function getCoachPlatformZone(
  index: number,
  totalCoaches: number
): {
  zone: "FRONT" | "CENTER" | "REAR";
  label: string;
  nearEscalator: boolean;
} {
  const fraction = index / Math.max(1, totalCoaches);

  if (fraction <= 0.35) {
    return {
      zone: "FRONT",
      label: "Engine Side (Front)",
      nearEscalator: false,
    };
  }
  if (fraction <= 0.7) {
    return {
      zone: "CENTER",
      label: "Platform Center (Near FOB & Escalator)",
      nearEscalator: true,
    };
  }
  return {
    zone: "REAR",
    label: "Guard Side (Rear)",
    nearEscalator: false,
  };
}

/**
 * Curated rake formations for flagship Indian trains.
 */
export const POPULAR_TRAIN_RAKES: Record<string, string[]> = {
  // Mumbai Rajdhani (12951 / 12952)
  "12951": [
    "LOCO", "EOG", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10",
    "PC", "A1", "A2", "A3", "A4", "A5", "H1", "EOG",
  ],
  "12952": [
    "LOCO", "EOG", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10",
    "PC", "A1", "A2", "A3", "A4", "A5", "H1", "EOG",
  ],
  // Howrah Rajdhani (12301 / 12302)
  "12301": [
    "LOCO", "EOG", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "PC",
    "A1", "A2", "A3", "A4", "H1", "EOG",
  ],
  // Shatabdi Express (12009 / 12010)
  "12009": [
    "LOCO", "EOG", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10",
    "E1", "E2", "EOG",
  ],
  // Paschim Express (12925 / 12926)
  "12925": [
    "LOCO", "SLR", "GEN", "GEN", "S1", "S2", "S3", "S4", "S5", "S6", "PC",
    "B1", "B2", "B3", "B4", "M1", "A1", "A2", "GEN", "SLR",
  ],
  // Kerala Express (12625 / 12626)
  "12626": [
    "LOCO", "SLR", "GEN", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "PC",
    "B1", "B2", "B3", "B4", "B5", "A1", "A2", "H1", "GEN", "SLR",
  ],
  // Vande Bharat Express (22436)
  "22436": [
    "LOCO", "C1", "C2", "C3", "C4", "C5", "C6", "E1", "C7", "C8", "C9", "C10", "C11", "C12", "E2", "LOCO",
  ],
};

/**
 * Builds a complete TrainRakeProfile from either a train's live rake array or fallback.
 */
export function buildTrainRakeProfile(
  trainNo: string,
  trainName: string,
  from: string,
  to: string,
  liveRake?: string[]
): TrainRakeProfile {
  const rawRake =
    liveRake && liveRake.length > 0
      ? liveRake
      : POPULAR_TRAIN_RAKES[trainNo] || [
          "LOCO", "SLR", "GEN", "S1", "S2", "S3", "S4", "S5", "S6", "PC",
          "B1", "B2", "B3", "B4", "A1", "A2", "GEN", "SLR",
        ];

  const coaches: CoachInRake[] = rawRake.map((code, idx) => {
    const pos = idx + 1;
    const classType = classifyCoachCode(code);
    const platform = getCoachPlatformZone(pos, rawRake.length);

    return {
      positionIndex: pos,
      coachCode: code,
      classType,
      platformZone: platform.zone,
      platformZoneLabel: platform.label,
      nearEscalator: platform.nearEscalator,
    };
  });

  return {
    trainNo,
    trainName,
    from,
    to,
    totalCoaches: coaches.length,
    coaches,
  };
}

