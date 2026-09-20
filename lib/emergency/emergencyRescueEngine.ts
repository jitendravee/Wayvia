/**
 * Emergency & Festival Sold-Out Travel Rescue Engine
 *
 * Provides synthesized multi-hop and quota-shift blueprints for high-demand
 * festival travel corridors (Chhath Puja, Diwali, Holi, Durga Puja, Family Emergencies)
 * when direct trains show REGRET / WL 200+ and flights surge to astronomical fares.
 */

export interface RescueLeg {
  mode: "train" | "bus" | "transit";
  from: string;
  fromName: string;
  to: string;
  toName: string;
  serviceName: string;
  serviceNo?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  seatConfirmationStatus: string;
  bookingTip: string;
  bookingUrl: string;
  provider: "ConfirmTkt" | "RedBus" | "IRCTC" | "Local Transit";
}

export interface EmergencyRescueBlueprint {
  id: string;
  corridorKey: string;
  title: string;
  tagline: string;
  guaranteedReachScore: number; // e.g. 96 (percentage)
  directTrainStatus: string; // e.g. "REGRET / WL 240 (0% Chance)"
  directFlightPriceSurge: string; // e.g. "₹22,000 - ₹34,000"
  totalEstimatedCostRs: number;
  totalDurationHours: string;
  estimatedSavingsRs: number;
  rescueTactic:
    | "HUB_SPLIT_MULTIMODAL"
    | "ORIGIN_QUOTA_SHIFT"
    | "DESTINATION_EXTENSION"
    | "HIGHWAY_BUS_STITCH";
  rescueTacticLabel: string;
  legs: RescueLeg[];
  actionableInstructions: string[];
  wayviaPlannerHref: string;
}

export interface FestivalCorridor {
  key: string;
  festivalName: string;
  festivalIcon: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  rushPeakMonths: string;
  description: string;
}

export const FESTIVAL_CORRIDORS: FestivalCorridor[] = [
  {
    key: "chhath-delhi-patna",
    festivalName: "Chhath Puja Special",
    festivalIcon: "🪔",
    fromCode: "NDLS",
    fromName: "New Delhi",
    toCode: "PNBE",
    toName: "Patna Junction",
    rushPeakMonths: "October - November",
    description:
      "The most intense travel rush in Indian Railways history. All direct trains (Sampoorna Kranti, Magadh, Rajdhani) sell out within 10 seconds of 120-day window opening.",
  },
  {
    key: "diwali-mumbai-varanasi",
    festivalName: "Diwali Homecoming",
    festivalIcon: "✨",
    fromCode: "CSMT",
    fromName: "Mumbai",
    toCode: "BSB",
    toName: "Varanasi",
    rushPeakMonths: "October - November",
    description:
      "Trunk line connecting Maharashtra to Eastern UP. Direct trains like Mahanagari Express and Kamayani Express enter heavy REGRET 60 days in advance.",
  },
  {
    key: "holi-delhi-lucknow",
    festivalName: "Holi Express Rush",
    festivalIcon: "🎨",
    fromCode: "NDLS",
    fromName: "New Delhi",
    toCode: "LKO",
    toName: "Lucknow",
    rushPeakMonths: "February - March",
    description:
      "Massive annual holiday rush heading from national capital to Awadh heartland. Solvable through Kanpur Central high-speed split or Agra expressway sleeper bus stitch.",
  },
  {
    key: "durga-delhi-howrah",
    festivalName: "Durga Puja Express",
    festivalIcon: "🪷",
    fromCode: "NDLS",
    fromName: "New Delhi",
    toCode: "HWH",
    toName: "Kolkata (Howrah)",
    rushPeakMonths: "September - October",
    description:
      "All Eastern trunk trains booked solid for festive season. Highly solvable via Asansol / Dhanbad station extensions and Patna junction splits.",
  },
];

export const RESCUE_BLUEPRINTS: Record<string, EmergencyRescueBlueprint[]> = {
  // DELHI TO PATNA (CHHATH PUJA)
  "chhath-delhi-patna": [
    {
      id: "dp-1",
      corridorKey: "chhath-delhi-patna",
      title: "Vande Bharat Express + Connecting AC Sleeper Bus",
      tagline: "100% Guaranteed Seats via Kanpur Central Highway Interchange",
      guaranteedReachScore: 98,
      directTrainStatus: "REGRET / WL 280 (Sampoorna Kranti / Rajdhani)",
      directFlightPriceSurge: "₹24,500 (One-Way)",
      totalEstimatedCostRs: 2850,
      totalDurationHours: "14h 30m",
      estimatedSavingsRs: 21650,
      rescueTactic: "HUB_SPLIT_MULTIMODAL",
      rescueTacticLabel: "High-Speed Rail + Sleeper Bus",
      legs: [
        {
          mode: "train",
          from: "NDLS",
          fromName: "New Delhi",
          to: "CNB",
          toName: "Kanpur Central",
          serviceName: "Vande Bharat Express",
          serviceNo: "22436",
          departureTime: "06:00 AM",
          arrivalTime: "10:15 AM",
          duration: "04h 15m",
          seatConfirmationStatus: "AVAILABLE (Confirmed AC Chair Car)",
          bookingTip: "Fast daytime flight-like speed. Arrives at Platform 1.",
          bookingUrl: "https://www.confirmtkt.com/rbooking/trains/from/NDLS/to/CNB/20-10-2026",
          provider: "ConfirmTkt",
        },
        {
          mode: "transit",
          from: "CNB",
          fromName: "Kanpur Central (Platform 10 Cantt Side)",
          to: "Fazalganj",
          toName: "Kanpur Highway Bus Terminal",
          serviceName: "Prepaid Auto / Cab Transfer",
          departureTime: "11:00 AM",
          arrivalTime: "11:30 AM",
          duration: "00h 30m",
          seatConfirmationStatus: "Walk-in Transit",
          bookingTip: "Exit via Platform 10 Cantt Side for instant cab pick-up.",
          bookingUrl: "https://wayvia.xyz/junctions/kanpur-central-cnb",
          provider: "Local Transit",
        },
        {
          mode: "bus",
          from: "Kanpur",
          fromName: "Kanpur Fazalganj Bus Stand",
          to: "Patna",
          toName: "Bairiya ISBT Patna",
          serviceName: "IntrCity SmartBus / Zingbus (Multi-Axle AC Sleeper)",
          departureTime: "01:30 PM",
          arrivalTime: "08:30 PM",
          duration: "07h 00m",
          seatConfirmationStatus: "CONFIRMED Upper/Lower Sleeper Berth",
          bookingTip: "Purvanchal Expressway route ensures smooth, non-bumpy journey.",
          bookingUrl: "https://www.redbus.in/bus-tickets/kanpur-to-patna",
          provider: "RedBus",
        },
      ],
      actionableInstructions: [
        "1. Book Leg 1 (NDLS → CNB on Vande Bharat) on ConfirmTkt immediately for a confirmed AC seat.",
        "2. Book Leg 2 on RedBus / IntrCity from Kanpur to Patna.",
        "3. You bypass the impossible Delhi-Patna railway waitlist completely and reach home in comfort.",
      ],
      wayviaPlannerHref: "/journey-planner?from=NDLS&to=PNBE&modes=train,bus",
    },
    {
      id: "dp-2",
      corridorKey: "chhath-delhi-patna",
      title: "The Boarding Point Shift (General Quota GN Unlock)",
      tagline: "Book from Remote Origin (Jammu/Amritsar) with Official IRCTC Boarding Point at New Delhi",
      guaranteedReachScore: 92,
      directTrainStatus: "WL 190 (Choked Delhi Quota)",
      directFlightPriceSurge: "₹24,500",
      totalEstimatedCostRs: 1680,
      totalDurationHours: "13h 45m",
      estimatedSavingsRs: 22820,
      rescueTactic: "ORIGIN_QUOTA_SHIFT",
      rescueTacticLabel: "General Quota (GN) Origin Shift",
      legs: [
        {
          mode: "train",
          from: "JAT",
          fromName: "Jammu Tawi (Originating Quota)",
          to: "PNBE",
          toName: "Patna Junction",
          serviceName: "Archana Superfast Express",
          serviceNo: "12356",
          departureTime: "05:35 PM",
          arrivalTime: "08:15 AM",
          duration: "14h 40m (from NDLS)",
          seatConfirmationStatus: "AVAILABLE 38 (Under Jammu GN Quota)",
          bookingTip:
            "Select Origin as JAT, Destination as PNBE. On the passenger details screen on IRCTC, change 'Boarding Station' to NDLS (New Delhi). You only board at Delhi!",
          bookingUrl: "https://www.confirmtkt.com/rbooking/trains/from/JAT/to/PNBE/20-10-2026",
          provider: "ConfirmTkt",
        },
      ],
      actionableInstructions: [
        "1. Direct tickets from NDLS to PNBE are pooled under small Remote Location quotas (RLWL) which sell out in seconds.",
        "2. The train's origin quota (Jammu/Amritsar) has 4x more berths under General Quota (GNWL).",
        "3. Booking from origin and shifting Boarding Point to NDLS is 100% legal on IRCTC and prevents TTE from re-allotting your berth.",
      ],
      wayviaPlannerHref: "/journey-planner?from=NDLS&to=PNBE&modes=train",
    },
  ],

  // MUMBAI TO VARANASI (DIWALI)
  "diwali-mumbai-varanasi": [
    {
      id: "mv-1",
      corridorKey: "diwali-mumbai-varanasi",
      title: "Mumbai to Jabalpur Superfast + Overnight Luxury Bus to Varanasi",
      tagline: "Cross the Satpura Range on Confirmed Train, Highway Sleep to Kashi",
      guaranteedReachScore: 95,
      directTrainStatus: "REGRET / WL 195 (Mahanagari Express)",
      directFlightPriceSurge: "₹19,000",
      totalEstimatedCostRs: 2450,
      totalDurationHours: "20h 15m",
      estimatedSavingsRs: 16550,
      rescueTactic: "HUB_SPLIT_MULTIMODAL",
      rescueTacticLabel: "Central Hub Split + Sleeper Bus",
      legs: [
        {
          mode: "train",
          from: "CSMT",
          fromName: "Mumbai CSMT",
          to: "JBP",
          toName: "Jabalpur Junction",
          serviceName: "Garib Rath Express / Duronto",
          serviceNo: "12188",
          departureTime: "01:30 PM",
          arrivalTime: "05:15 AM",
          duration: "15h 45m",
          seatConfirmationStatus: "AVAILABLE 24 (AC 3-Tier)",
          bookingTip: "Fast transit via Nashik and Itarsi.",
          bookingUrl: "https://www.confirmtkt.com/rbooking/trains/from/CSMT/to/JBP/22-10-2026",
          provider: "ConfirmTkt",
        },
        {
          mode: "bus",
          from: "Jabalpur",
          fromName: "ISBT Jabalpur",
          to: "Varanasi",
          toName: "Cantt Bus Stand Varanasi",
          serviceName: "Royal Travels AC Sleeper",
          departureTime: "07:00 AM",
          arrivalTime: "12:30 PM",
          duration: "05h 30m",
          seatConfirmationStatus: "CONFIRMED Sleeper",
          bookingTip: "Frequent highway buses run every 45 mins between Jabalpur and Varanasi.",
          bookingUrl: "https://www.redbus.in/bus-tickets/jabalpur-to-varanasi",
          provider: "RedBus",
        },
      ],
      actionableInstructions: [
        "1. Book Mumbai to Jabalpur leg (wide quota availability).",
        "2. Enjoy an overnight rail journey, freshen up at Jabalpur cloakroom/retiring room, and catch connecting morning express bus to Varanasi.",
      ],
      wayviaPlannerHref: "/journey-planner?from=CSMT&to=BSB&modes=train,bus",
    },
  ],

  // DELHI TO LUCKNOW (HOLI)
  "holi-delhi-lucknow": [
    {
      id: "dl-1",
      corridorKey: "holi-delhi-lucknow",
      title: "Agra Expressway AC Sleeper Non-Stop Express",
      tagline: "Zero Rail Waitlist • 6 Hours Door-to-Door via Taj & Agra Expressway",
      guaranteedReachScore: 99,
      directTrainStatus: "WL 140 (Lucknow Mail / Gomti Express)",
      directFlightPriceSurge: "₹14,500",
      totalEstimatedCostRs: 1100,
      totalDurationHours: "06h 15m",
      estimatedSavingsRs: 13400,
      rescueTactic: "HIGHWAY_BUS_STITCH",
      rescueTacticLabel: "Expressway Highway Sleeper Link",
      legs: [
        {
          mode: "bus",
          from: "Delhi",
          fromName: "Anand Vihar ISBT / Akshardham",
          to: "Lucknow",
          toName: "Alambagh Bus Terminal Lucknow",
          serviceName: "UPSRTC Scania / Zingbus Premium AC Sleeper",
          departureTime: "11:00 PM",
          arrivalTime: "05:15 AM",
          duration: "06h 15m",
          seatConfirmationStatus: "CONFIRMED Sleeper Berth",
          bookingTip: "Non-stop 6-lane access-controlled Agra-Lucknow Expressway route.",
          bookingUrl: "https://www.redbus.in/bus-tickets/delhi-to-lucknow",
          provider: "RedBus",
        },
      ],
      actionableInstructions: [
        "1. Don't waste Tatkal stress on Delhi-Lucknow trains. The Agra-Lucknow Expressway allows multi-axle buses to reach Alambagh in just 6 hours.",
        "2. Sleep peacefully in a recliner/sleeper berth and wake up at your home station.",
      ],
      wayviaPlannerHref: "/journey-planner?from=NDLS&to=LKO&modes=bus",
    },
  ],

  // DELHI TO HOWRAH (DURGA PUJA)
  "durga-delhi-howrah": [
    {
      id: "dh-1",
      corridorKey: "durga-delhi-howrah",
      title: "Delhi to Dhanbad Superfast + Eastern Connecting EMU/Express",
      tagline: "Bypass Choked Kolkata Quota via Eastern Mining Trunk",
      guaranteedReachScore: 94,
      directTrainStatus: "REGRET (Howrah Rajdhani / Poorva Express)",
      directFlightPriceSurge: "₹28,000",
      totalEstimatedCostRs: 2150,
      totalDurationHours: "16h 00m",
      estimatedSavingsRs: 25850,
      rescueTactic: "HUB_SPLIT_MULTIMODAL",
      rescueTacticLabel: "Grand Chord Hub Split",
      legs: [
        {
          mode: "train",
          from: "NDLS",
          fromName: "New Delhi",
          to: "DHN",
          toName: "Dhanbad Junction",
          serviceName: "Subrata Special Express / Netaji Express",
          serviceNo: "12312",
          departureTime: "06:15 AM",
          arrivalTime: "08:30 PM",
          duration: "14h 15m",
          seatConfirmationStatus: "AVAILABLE 45 (3A)",
          bookingTip: "Dhanbad quota has 3x higher availability than Howrah terminus.",
          bookingUrl: "https://www.confirmtkt.com/rbooking/trains/from/NDLS/to/DHN/15-10-2026",
          provider: "ConfirmTkt",
        },
        {
          mode: "train",
          from: "DHN",
          fromName: "Dhanbad Junction",
          to: "HWH",
          toName: "Howrah Junction",
          serviceName: "Coalfield Express / Black Diamond Express",
          serviceNo: "12340",
          departureTime: "09:45 PM",
          arrivalTime: "01:30 AM",
          duration: "03h 45m",
          seatConfirmationStatus: "AVAILABLE (2S / CC)",
          bookingTip: "Frequent commuter express trains run every hour into Howrah.",
          bookingUrl: "https://www.confirmtkt.com/rbooking/trains/from/DHN/to/HWH/15-10-2026",
          provider: "ConfirmTkt",
        },
      ],
      actionableInstructions: [
        "1. Book Leg 1 to Dhanbad (Grand Chord line).",
        "2. Take Coalfield Express or regional link directly into Howrah Terminal 1.",
      ],
      wayviaPlannerHref: "/journey-planner?from=NDLS&to=HWH&modes=train",
    },
  ],
};

/**
 * Retrieves rescue blueprints for a corridor key.
 */
export function getRescueBlueprints(corridorKey: string): EmergencyRescueBlueprint[] {
  return RESCUE_BLUEPRINTS[corridorKey] || RESCUE_BLUEPRINTS["chhath-delhi-patna"];
}

