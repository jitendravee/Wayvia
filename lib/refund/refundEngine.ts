/**
 * IRCTC & Indian Railways Official Cancellation & Refund Rules Engine
 *
 * Implements the Railway Passengers (Cancellation of Ticket and Refund of Fare)
 * Rules framed under Section 143 of the Railways Act, 1989 (including 2015 amendments
 * and subsequent circulars on GST, Tatkal, and TDR filing).
 */

import { PnrData } from "@/lib/erail/pnrTypes";

export type TravelClass =
  | "1A"
  | "2A"
  | "3A"
  | "3E"
  | "CC"
  | "EC"
  | "SL"
  | "2S";

export type BookingQuota =
  | "GN" // General
  | "TQ" // Tatkal
  | "PT" // Premium Tatkal
  | "LD" // Ladies
  | "SS"; // Senior Citizen

export type TicketStatusType =
  | "CNF" // Confirmed
  | "RAC" // Reservation Against Cancellation
  | "WL" // Waitlisted
  | "PARTIAL"; // Partial (Some CNF, some WL/RAC)

export type CancellationTiming =
  | "MORE_THAN_48_HRS" // > 48 hrs before scheduled departure
  | "BETWEEN_48_AND_12_HRS" // 48 hrs to 12 hrs before scheduled departure
  | "BETWEEN_12_AND_4_HRS" // 12 hrs to 4 hrs (or before chart preparation)
  | "LESS_THAN_4_HRS_OR_CHARTED" // < 4 hrs or after chart prepared
  | "TRAIN_CANCELLED" // Train cancelled by Railways (100% refund)
  | "TRAIN_DELAYED_3HRS"; // Train delayed > 3 hrs and passenger did not travel

export interface ClassMetadata {
  code: TravelClass;
  name: string;
  isAc: boolean;
  flatCancellationFee: number; // Flat deduction if cancelled > 48h before departure
  typicalFarePerPax: number;
}

export const CLASS_METADATA: Record<TravelClass, ClassMetadata> = {
  "1A": {
    code: "1A",
    name: "First AC (1A)",
    isAc: true,
    flatCancellationFee: 240,
    typicalFarePerPax: 3200,
  },
  EC: {
    code: "EC",
    name: "Executive Chair Car (EC)",
    isAc: true,
    flatCancellationFee: 240,
    typicalFarePerPax: 2200,
  },
  "2A": {
    code: "2A",
    name: "AC 2-Tier (2A)",
    isAc: true,
    flatCancellationFee: 200,
    typicalFarePerPax: 1950,
  },
  "3A": {
    code: "3A",
    name: "AC 3-Tier (3A)",
    isAc: true,
    flatCancellationFee: 180,
    typicalFarePerPax: 1350,
  },
  "3E": {
    code: "3E",
    name: "AC 3-Economy (3E)",
    isAc: true,
    flatCancellationFee: 180,
    typicalFarePerPax: 1250,
  },
  CC: {
    code: "CC",
    name: "AC Chair Car (CC)",
    isAc: true,
    flatCancellationFee: 180,
    typicalFarePerPax: 980,
  },
  SL: {
    code: "SL",
    name: "Sleeper Class (SL)",
    isAc: false,
    flatCancellationFee: 120,
    typicalFarePerPax: 490,
  },
  "2S": {
    code: "2S",
    name: "Second Sitting (2S)",
    isAc: false,
    flatCancellationFee: 60,
    typicalFarePerPax: 180,
  },
};

export const CLERKAGE_FEE_RAC_WL = 60; // Flat clerkage per passenger for RAC/WL
export const AC_GST_RATE = 0.05; // 5% GST levied on cancellation charges for AC classes

export interface DeductionItem {
  id: string;
  label: string;
  amount: number;
  ruleCitation: string;
  explanation: string;
  isGst?: boolean;
}

export interface RefundCalculationInput {
  ticketClass: TravelClass;
  ticketFare: number;
  passengerCount: number;
  ticketStatus: TicketStatusType;
  quota: BookingQuota;
  timing: CancellationTiming;
}

export interface RefundCalculationResult {
  input: RefundCalculationInput;
  totalFarePaid: number;
  totalDeductions: number;
  netRefundAmount: number;
  refundPercentage: number;
  cancellationFee: number;
  gstOnCancellation: number;
  clerkageFee: number;
  deductionBreakdown: DeductionItem[];
  applicableRuleSummary: string;
  tdrRequired: boolean;
  tdrEligibleReason?: string;
  criticalDeadlineMessage: string;
  nextSlabWarning?: {
    timeRemainingDescription: string;
    potentialExtraLoss: number;
    advice: string;
  };
  refundTimeline: string;
}

/**
 * Calculates the exact refund amount and itemized deduction breakdown according to IRCTC rules.
 */
export function calculateRefund(input: RefundCalculationInput): RefundCalculationResult {
  const meta = CLASS_METADATA[input.ticketClass] || CLASS_METADATA["3A"];
  const count = Math.max(1, input.passengerCount);
  const totalFare = Math.max(0, input.ticketFare);

  const deductions: DeductionItem[] = [];
  let cancellationFee = 0;
  let gstAmount = 0;
  let clerkageFee = 0;
  let tdrRequired = false;
  let tdrEligibleReason: string | undefined;
  let ruleSummary = "";
  let criticalDeadline = "";
  let nextSlabWarning: RefundCalculationResult["nextSlabWarning"] | undefined;

  // Case 1: Train cancelled by Indian Railways
  if (input.timing === "TRAIN_CANCELLED") {
    ruleSummary = "Full refund automatically credited as the train was cancelled by Indian Railways.";
    criticalDeadline = "E-tickets are automatically refunded to source account. No manual cancellation required.";
    return {
      input,
      totalFarePaid: totalFare,
      totalDeductions: 0,
      netRefundAmount: totalFare,
      refundPercentage: 100,
      cancellationFee: 0,
      gstOnCancellation: 0,
      clerkageFee: 0,
      deductionBreakdown: [],
      applicableRuleSummary: ruleSummary,
      tdrRequired: false,
      criticalDeadlineMessage: criticalDeadline,
      refundTimeline: "3 to 5 working days (automatic credit to source payment method)",
    };
  }

  // Case 2: Train delayed by more than 3 hours & passenger did not travel
  if (input.timing === "TRAIN_DELAYED_3HRS") {
    tdrRequired = true;
    tdrEligibleReason = "Train Running Late by > 3 Hours at Originating / Boarding Station";
    ruleSummary = "100% fare refunded without cancellation charges upon filing an online TDR before train departure.";
    criticalDeadline = "TDR must be filed on IRCTC before the actual departure of the train from your boarding station.";
    return {
      input,
      totalFarePaid: totalFare,
      totalDeductions: 0,
      netRefundAmount: totalFare,
      refundPercentage: 100,
      cancellationFee: 0,
      gstOnCancellation: 0,
      clerkageFee: 0,
      deductionBreakdown: [],
      applicableRuleSummary: ruleSummary,
      tdrRequired: true,
      tdrEligibleReason,
      criticalDeadlineMessage: criticalDeadline,
      refundTimeline: "30 to 60 days post TDR verification by Zonal Railways",
    };
  }

  // Case 3: Confirmed Tatkal Ticket
  if (input.quota === "TQ" && input.ticketStatus === "CNF") {
    cancellationFee = totalFare;
    deductions.push({
      id: "cnf-tatkal-deduction",
      label: "Confirmed Tatkal Ticket Forfeiture",
      amount: totalFare,
      ruleCitation: "IRCTC Tatkal Scheme Rules, Para 8",
      explanation: "No refund of fare is granted on cancellation of confirmed Tatkal tickets under any circumstances, except if the train is cancelled or delayed > 3 hours.",
    });

    ruleSummary = "Confirmed Tatkal tickets carry ZERO refund upon passenger cancellation.";
    criticalDeadline = "Cancellation will forfeit 100% of the ticket fare. Consider travelling or filing a TDR only if the train is delayed > 3 hrs.";
    return {
      input,
      totalFarePaid: totalFare,
      totalDeductions: totalFare,
      netRefundAmount: 0,
      refundPercentage: 0,
      cancellationFee: totalFare,
      gstOnCancellation: 0,
      clerkageFee: 0,
      deductionBreakdown: deductions,
      applicableRuleSummary: ruleSummary,
      tdrRequired: false,
      criticalDeadlineMessage: criticalDeadline,
      refundTimeline: "No refund payable for Confirmed Tatkal cancellations",
    };
  }

  // Case 4: Waitlisted (WL) or RAC Ticket
  if (input.ticketStatus === "WL" || input.ticketStatus === "RAC") {
    // If cancelled up to 30 mins before departure
    const rawClerkage = CLERKAGE_FEE_RAC_WL * count;
    const gstOnClerkage = meta.isAc ? Math.round(rawClerkage * AC_GST_RATE) : 0;
    clerkageFee = rawClerkage;
    gstAmount = gstOnClerkage;

    deductions.push({
      id: "rac-wl-clerkage",
      label: `Clerkage Charge (₹${CLERKAGE_FEE_RAC_WL} × ${count} pax)`,
      amount: rawClerkage,
      ruleCitation: "Railway Board Rule 7(1) - RAC/WL Clerkage",
      explanation: `Flat clerkage charge of ₹${CLERKAGE_FEE_RAC_WL} per passenger applies to RAC and Waitlisted tickets cancelled up to 30 minutes before scheduled departure.`,
    });

    if (gstOnClerkage > 0) {
      deductions.push({
        id: "ac-gst-clerkage",
        label: `5% GST on Clerkage Fee`,
        amount: gstOnClerkage,
        ruleCitation: "Ministry of Finance GST Circular on AC Passenger Services",
        explanation: "5% Goods and Services Tax applicable on clerkage and cancellation charges for AC coaches (1A, 2A, 3A, 3E, CC, EC).",
        isGst: true,
      });
    }

    const totalDed = Math.min(totalFare, rawClerkage + gstOnClerkage);
    const netRefund = Math.max(0, totalFare - totalDed);
    const refundPct = totalFare > 0 ? Math.round((netRefund / totalFare) * 100) : 0;

    ruleSummary = `RAC / Waitlisted ticket cancelled: Flat clerkage of ₹${CLERKAGE_FEE_RAC_WL}/pax (+ ${meta.isAc ? "GST" : "no GST"}) deducted. Remainder refunded.`;
    criticalDeadline = "Must be cancelled at least 30 minutes before scheduled train departure. Fully waitlisted e-tickets are auto-cancelled on chart prep.";

    return {
      input,
      totalFarePaid: totalFare,
      totalDeductions: totalDed,
      netRefundAmount: netRefund,
      refundPercentage: refundPct,
      cancellationFee: 0,
      gstOnCancellation: gstOnClerkage,
      clerkageFee: rawClerkage,
      deductionBreakdown: deductions,
      applicableRuleSummary: ruleSummary,
      tdrRequired: false,
      criticalDeadlineMessage: criticalDeadline,
      refundTimeline: "3 to 5 working days (automatic credit to UPI / Bank Account)",
    };
  }

  // Case 5: Partially Confirmed Ticket (Group / Family where 1 is CNF and 1 is WL/RAC)
  if (input.ticketStatus === "PARTIAL") {
    // Under Rule 6(2), if a party ticket has both CNF and WL/RAC, full refund is granted to all passengers minus clerkage
    // provided the ticket is cancelled up to 30 mins before departure!
    const rawClerkage = CLERKAGE_FEE_RAC_WL * count;
    const gstOnClerkage = meta.isAc ? Math.round(rawClerkage * AC_GST_RATE) : 0;
    clerkageFee = rawClerkage;
    gstAmount = gstOnClerkage;

    deductions.push({
      id: "partial-clerkage",
      label: `Clerkage Charge under Rule 6(2) (₹${CLERKAGE_FEE_RAC_WL} × ${count} pax)`,
      amount: rawClerkage,
      ruleCitation: "Railway Board Rule 6(2) - Combined Ticket Concession",
      explanation: "On family/group tickets where some passengers are Confirmed and others are RAC/Waitlisted, all passengers are refunded with only clerkage deducted if cancelled up to 30 mins before departure.",
    });

    if (gstOnClerkage > 0) {
      deductions.push({
        id: "ac-gst-partial",
        label: `5% GST on Clerkage Fee`,
        amount: gstOnClerkage,
        ruleCitation: "GST Circular on Railway AC Classes",
        explanation: "5% Goods and Services Tax applicable on clerkage charges for AC coaches.",
        isGst: true,
      });
    }

    const totalDed = Math.min(totalFare, rawClerkage + gstOnClerkage);
    const netRefund = Math.max(0, totalFare - totalDed);
    const refundPct = totalFare > 0 ? Math.round((netRefund / totalFare) * 100) : 0;

    ruleSummary = "Partially confirmed family ticket: Concession under Rule 6(2) allows cancellation with only flat clerkage deducted.";
    criticalDeadline = "All passengers must cancel together at least 30 minutes before scheduled departure to avail clerkage rate.";

    return {
      input,
      totalFarePaid: totalFare,
      totalDeductions: totalDed,
      netRefundAmount: netRefund,
      refundPercentage: refundPct,
      cancellationFee: 0,
      gstOnCancellation: gstOnClerkage,
      clerkageFee: rawClerkage,
      deductionBreakdown: deductions,
      applicableRuleSummary: ruleSummary,
      tdrRequired: false,
      criticalDeadlineMessage: criticalDeadline,
      refundTimeline: "3 to 5 working days to source bank account",
    };
  }

  // Case 6: Confirmed Ticket (General Quota) by Timing Slabs
  const flatBaseFee = meta.flatCancellationFee * count;

  switch (input.timing) {
    case "MORE_THAN_48_HRS": {
      cancellationFee = flatBaseFee;
      gstAmount = meta.isAc ? Math.round(cancellationFee * AC_GST_RATE) : 0;

      deductions.push({
        id: "flat-cancellation-fee",
        label: `Flat Cancellation Charge (${meta.name}: ₹${meta.flatCancellationFee} × ${count} pax)`,
        amount: flatBaseFee,
        ruleCitation: "Railway Board Rule 6(1)(a) - >48 Hours Prior",
        explanation: `Cancelled more than 48 hours before scheduled departure. Flat statutory cancellation fee of ₹${meta.flatCancellationFee} applies per passenger.`,
      });

      if (gstAmount > 0) {
        deductions.push({
          id: "ac-gst-fee",
          label: "5% GST on Cancellation Fee",
          amount: gstAmount,
          ruleCitation: "GST Notification No. 11/2017-Central Tax (Rate)",
          explanation: "5% GST levied on cancellation charges for AC coaches (1A, 2A, 3A, 3E, CC, EC).",
          isGst: true,
        });
      }

      ruleSummary = `Cancelled > 48 hours prior. Minimum flat cancellation charge of ₹${meta.flatCancellationFee}/passenger applies.`;
      criticalDeadline = "Safe window. When within 48 hours of departure, deductions jump to 25% of total fare.";
      
      const slab25Cost = Math.max(flatBaseFee, Math.round(totalFare * 0.25));
      const potentialExtraLoss = Math.max(0, slab25Cost - flatBaseFee);
      if (potentialExtraLoss > 0) {
        nextSlabWarning = {
          timeRemainingDescription: "before 48 hours to departure",
          potentialExtraLoss,
          advice: `If you delay past the 48-hour mark, deductions will increase to 25% (an additional ₹${potentialExtraLoss}).`,
        };
      }
      break;
    }

    case "BETWEEN_48_AND_12_HRS": {
      // 25% of total base fare, subject to minimum flat cancellation fee per passenger
      const percent25 = Math.round(totalFare * 0.25);
      cancellationFee = Math.max(flatBaseFee, percent25);
      gstAmount = meta.isAc ? Math.round(cancellationFee * AC_GST_RATE) : 0;

      deductions.push({
        id: "25-percent-fee",
        label: `25% Fare Deduction (Min ₹${flatBaseFee})`,
        amount: cancellationFee,
        ruleCitation: "Railway Board Rule 6(1)(b) - 48h to 12h Prior",
        explanation: `Cancelled between 48 hours and 12 hours before scheduled departure. 25% of the total fare is deducted (subject to a minimum of ₹${meta.flatCancellationFee}/pax).`,
      });

      if (gstAmount > 0) {
        deductions.push({
          id: "ac-gst-fee",
          label: "5% GST on Cancellation Fee",
          amount: gstAmount,
          ruleCitation: "GST Circular on Railway AC Classes",
          explanation: "5% GST levied on cancellation fee for AC coaches.",
          isGst: true,
        });
      }

      ruleSummary = "Cancelled between 48 and 12 hours before departure: 25% of the fare is deducted.";
      criticalDeadline = "Urgent: When less than 12 hours remain, the deduction jumps to 50% of the total fare!";

      const slab50Cost = Math.max(flatBaseFee, Math.round(totalFare * 0.5));
      const potentialExtraLoss = Math.max(0, slab50Cost - cancellationFee);
      nextSlabWarning = {
        timeRemainingDescription: "before 12 hours to departure",
        potentialExtraLoss,
        advice: `Cancelling now saves you ₹${potentialExtraLoss}. If you enter the 12-hour window, deduction doubles to 50%!`,
      };
      break;
    }

    case "BETWEEN_12_AND_4_HRS": {
      // 50% of total base fare, subject to minimum flat cancellation fee per passenger
      const percent50 = Math.round(totalFare * 0.5);
      cancellationFee = Math.max(flatBaseFee, percent50);
      gstAmount = meta.isAc ? Math.round(cancellationFee * AC_GST_RATE) : 0;

      deductions.push({
        id: "50-percent-fee",
        label: `50% Fare Deduction (Min ₹${flatBaseFee})`,
        amount: cancellationFee,
        ruleCitation: "Railway Board Rule 6(1)(c) - 12h to 4h Prior",
        explanation: `Cancelled between 12 hours and 4 hours before scheduled departure (or before chart preparation). 50% of the fare is forfeited.`,
      });

      if (gstAmount > 0) {
        deductions.push({
          id: "ac-gst-fee",
          label: "5% GST on Cancellation Fee",
          amount: gstAmount,
          ruleCitation: "GST Circular on Railway AC Classes",
          explanation: "5% GST levied on cancellation fee for AC coaches.",
          isGst: true,
        });
      }

      ruleSummary = "Cancelled between 12 and 4 hours before departure: 50% of the ticket fare is deducted.";
      criticalDeadline = "CRITICAL WARNING: Charting begins 4 hours before departure. Once chart is prepared, refund becomes ZERO (100% loss). Cancel immediately!";

      const potentialExtraLoss = Math.max(0, totalFare - cancellationFee - gstAmount);
      nextSlabWarning = {
        timeRemainingDescription: "before 4 hours (chart preparation)",
        potentialExtraLoss,
        advice: `ACT IMMEDIATELY: In less than 4 hours, your remaining ₹${potentialExtraLoss} refund will be completely forfeited to ₹0!`,
      };
      break;
    }

    case "LESS_THAN_4_HRS_OR_CHARTED":
    default: {
      cancellationFee = totalFare;
      gstAmount = 0;

      deductions.push({
        id: "zero-refund-forfeiture",
        label: "100% Fare Forfeiture (Chart Prepared / < 4 Hours)",
        amount: totalFare,
        ruleCitation: "Railway Board Rule 6(1)(c) Second Proviso",
        explanation: "No refund is admissible on Confirmed tickets cancelled less than 4 hours before scheduled departure or after chart preparation.",
      });

      ruleSummary = "No refund is admissible for confirmed tickets cancelled less than 4 hours before departure or after chart preparation.";
      criticalDeadline = "Online cancellation is closed. If your train is delayed > 3 hrs, you may file a TDR for a 100% refund.";
      break;
    }
  }

  const totalDeductions = Math.min(totalFare, cancellationFee + gstAmount);
  const netRefundAmount = Math.max(0, totalFare - totalDeductions);
  const refundPercentage = totalFare > 0 ? Math.round((netRefundAmount / totalFare) * 100) : 0;

  return {
    input,
    totalFarePaid: totalFare,
    totalDeductions,
    netRefundAmount,
    refundPercentage,
    cancellationFee,
    gstOnCancellation: gstAmount,
    clerkageFee,
    deductionBreakdown: deductions,
    applicableRuleSummary: ruleSummary,
    tdrRequired,
    tdrEligibleReason,
    criticalDeadlineMessage: criticalDeadline,
    nextSlabWarning,
    refundTimeline: netRefundAmount > 0 ? "3 to 5 working days directly to source payment account" : "No refund payable",
  };
}

/**
 * Smartly maps live PnrData from /api/erail/pnrStatus into a RefundCalculationInput.
 */
export function parsePnrDataToRefundInput(
  pnrData: PnrData,
  timingOverride?: CancellationTiming
): RefundCalculationInput {
  // 1. Detect Class
  let ticketClass: TravelClass = "3A";
  if (pnrData.journeyClass) {
    const rawClass = pnrData.journeyClass.toUpperCase().trim();
    if (["1A", "2A", "3A", "3E", "CC", "EC", "SL", "2S"].includes(rawClass)) {
      ticketClass = rawClass as TravelClass;
    } else if (rawClass.includes("FIRST")) ticketClass = "1A";
    else if (rawClass.includes("TWO") || rawClass.includes("2ND AC")) ticketClass = "2A";
    else if (rawClass.includes("THREE") || rawClass.includes("3RD AC")) ticketClass = "3A";
    else if (rawClass.includes("SLEEPER")) ticketClass = "SL";
    else if (rawClass.includes("CHAIR")) ticketClass = "CC";
  }

  // 2. Detect Passenger Count
  const passengers = pnrData.passengerList || [];
  const passengerCount = passengers.length > 0 ? passengers.length : pnrData.numberOfpassenger || 1;

  // 3. Detect Quota
  let quota: BookingQuota = "GN";
  if (pnrData.quota) {
    const rawQuota = pnrData.quota.toUpperCase().trim();
    if (rawQuota === "TQ" || rawQuota === "TATKAL") quota = "TQ";
    else if (rawQuota === "PT" || rawQuota.includes("PREMIUM")) quota = "PT";
    else if (rawQuota === "LD" || rawQuota.includes("LADIES")) quota = "LD";
    else if (rawQuota === "SS") quota = "SS";
  }

  // 4. Detect Ticket Status (CNF, RAC, WL, PARTIAL)
  let cnfCount = 0;
  let racCount = 0;
  let wlCount = 0;

  for (const p of passengers) {
    const status = (p.currentStatus || p.bookingStatus || "").toUpperCase();
    if (status.includes("CNF") || status.includes("CONFIRM")) cnfCount++;
    else if (status.includes("RAC")) racCount++;
    else if (status.includes("WL") || status.includes("WAIT")) wlCount++;
  }

  let ticketStatus: TicketStatusType = "CNF";
  if (passengers.length > 0) {
    if (cnfCount > 0 && (racCount > 0 || wlCount > 0)) {
      ticketStatus = "PARTIAL";
    } else if (wlCount > 0 && cnfCount === 0 && racCount === 0) {
      ticketStatus = "WL";
    } else if (racCount > 0 && cnfCount === 0) {
      ticketStatus = "RAC";
    } else {
      ticketStatus = "CNF";
    }
  }

  // 5. Detect Total Fare
  let ticketFare = pnrData.ticketFare || pnrData.bookingFare || 0;
  if (!ticketFare || ticketFare <= 0) {
    ticketFare = (CLASS_METADATA[ticketClass]?.typicalFarePerPax || 1200) * passengerCount;
  }

  // 6. Detect Cancellation Timing
  let timing: CancellationTiming = timingOverride || "MORE_THAN_48_HRS";
  if (!timingOverride) {
    if (pnrData.chartStatus && pnrData.chartStatus.toUpperCase().includes("CHART PREPARED")) {
      timing = "LESS_THAN_4_HRS_OR_CHARTED";
    } else if (pnrData.dateOfJourney) {
      try {
        // e.g. "22-09-2026" or "2026-09-22"
        const parts = pnrData.dateOfJourney.split(/[-/]/);
        let dojDate: Date | null = null;
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            dojDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00+05:30`);
          } else {
            dojDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00+05:30`);
          }
        }
        if (dojDate && !isNaN(dojDate.getTime())) {
          const now = new Date();
          const diffHours = (dojDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (diffHours < 4) timing = "LESS_THAN_4_HRS_OR_CHARTED";
          else if (diffHours < 12) timing = "BETWEEN_12_AND_4_HRS";
          else if (diffHours < 48) timing = "BETWEEN_48_AND_12_HRS";
          else timing = "MORE_THAN_48_HRS";
        }
      } catch {
        timing = "MORE_THAN_48_HRS";
      }
    }
  }

  return {
    ticketClass,
    ticketFare,
    passengerCount,
    ticketStatus,
    quota,
    timing,
  };
}

/**
 * Smart Regex Parser for IRCTC SMS, WhatsApp messages, or pasted e-ticket confirmations.
 */
export function parseSmsOrTicketText(text: string): {
  pnr?: string;
  trainNumber?: string;
  journeyClass?: TravelClass;
  fare?: number;
  passengerCount?: number;
  ticketStatus?: TicketStatusType;
  quota?: BookingQuota;
} {
  const result: ReturnType<typeof parseSmsOrTicketText> = {};
  if (!text) return result;

  // 1. PNR: 10 consecutive digits
  const pnrMatch = text.match(/(?:PNR\s*[:#-]?\s*|pnr\s*[:#-]?\s*)?(\b\d{10}\b)/i);
  if (pnrMatch && pnrMatch[1]) {
    result.pnr = pnrMatch[1];
  }

  // 2. Train Number: 5 consecutive digits
  const trainMatch = text.match(/(?:Train\s*(?:No|Num)?[:#-]?\s*|Trn\s*[:#-]?\s*)?(\b\d{5}\b)/i);
  if (trainMatch && trainMatch[1]) {
    result.trainNumber = trainMatch[1];
  }

  // 3. Class (1A, 2A, 3A, 3E, CC, EC, SL, 2S)
  const classMatch = text.match(/\b(1A|2A|3A|3E|CC|EC|SL|2S)\b/i);
  if (classMatch && classMatch[1]) {
    result.journeyClass = classMatch[1].toUpperCase() as TravelClass;
  } else if (/sleeper/i.test(text)) {
    result.journeyClass = "SL";
  } else if (/chair\s*car/i.test(text)) {
    result.journeyClass = "CC";
  }

  // 4. Fare: e.g. "Rs. 2450", "Fare: 1850", "INR 3200", "Total: 1400"
  const fareMatch = text.match(/(?:fare|amt|amount|total|rs\.?|inr|₹)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)/i);
  if (fareMatch && fareMatch[1]) {
    result.fare = Math.round(parseFloat(fareMatch[1]));
  }

  // 5. Quota (Tatkal, Premium Tatkal, General)
  if (/premium\s*tatkal|\bPT\b/i.test(text)) {
    result.quota = "PT";
  } else if (/tatkal|\bTQ\b/i.test(text)) {
    result.quota = "TQ";
  } else {
    result.quota = "GN";
  }

  // 6. Status
  if (/CNF|CONFIRM|B\d+|S\d+|M\d+|A\d+|H\d+|C\d+/i.test(text)) {
    result.ticketStatus = "CNF";
  } else if (/RAC/i.test(text)) {
    result.ticketStatus = "RAC";
  } else if (/WL|WAITLIST|WAITING/i.test(text)) {
    result.ticketStatus = "WL";
  }

  // 7. Passenger count inference
  const paxMatch = text.match(/(\d+)\s*(?:pax|passengers|adults)/i);
  if (paxMatch && paxMatch[1]) {
    result.passengerCount = parseInt(paxMatch[1], 10);
  }

  return result;
}

/**
 * Common cancellation rules guide for display in reference table.
 */
export const RULES_REFERENCE_TABLE = [
  {
    classCode: "1A / EC",
    className: "First AC & Executive Chair Car",
    moreThan48h: "Flat ₹240 + 5% GST (₹252)",
    between48And12h: "25% of fare (Min ₹252 with GST)",
    between12And4h: "50% of fare (Min ₹252 with GST)",
    lessThan4h: "0% Refund (No refund)",
  },
  {
    classCode: "2A / FC",
    className: "AC 2-Tier & First Class",
    moreThan48h: "Flat ₹200 + 5% GST (₹210)",
    between48And12h: "25% of fare (Min ₹210 with GST)",
    between12And4h: "50% of fare (Min ₹210 with GST)",
    lessThan4h: "0% Refund (No refund)",
  },
  {
    classCode: "3A / 3E / CC",
    className: "AC 3-Tier, 3-Economy & Chair Car",
    moreThan48h: "Flat ₹180 + 5% GST (₹189)",
    between48And12h: "25% of fare (Min ₹189 with GST)",
    between12And4h: "50% of fare (Min ₹189 with GST)",
    lessThan4h: "0% Refund (No refund)",
  },
  {
    classCode: "SL",
    className: "Sleeper Class",
    moreThan48h: "Flat ₹120 (No GST)",
    between48And12h: "25% of fare (Min ₹120)",
    between12And4h: "50% of fare (Min ₹120)",
    lessThan4h: "0% Refund (No refund)",
  },
  {
    classCode: "2S",
    className: "Second Sitting (Reserved)",
    moreThan48h: "Flat ₹60 (No GST)",
    between48And12h: "25% of fare (Min ₹60)",
    between12And4h: "50% of fare (Min ₹60)",
    lessThan4h: "0% Refund (No refund)",
  },
  {
    classCode: "RAC / WL",
    className: "All RAC & Waitlisted Tickets",
    moreThan48h: "Flat ₹60 clerkage (+ GST for AC)",
    between48And12h: "Flat ₹60 clerkage (+ GST for AC)",
    between12And4h: "Flat ₹60 clerkage (up to 30 min prior)",
    lessThan4h: "Auto-cancelled if fully WL on charting",
  },
  {
    classCode: "Tatkal CNF",
    className: "Confirmed Tatkal Tickets",
    moreThan48h: "0% Refund (No refund admissible)",
    between48And12h: "0% Refund (No refund admissible)",
    between12And4h: "0% Refund (No refund admissible)",
    lessThan4h: "0% Refund (TDR only if train delayed >3h)",
  },
];

