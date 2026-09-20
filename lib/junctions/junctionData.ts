/**
 * Indian Railways Junction Hub & Transfer Knowledge Engine
 *
 * Provides architectural layover guides, inter-station transit navigators (Metro/cabs),
 * cloakroom rules, executive lounges, and minimum connection times (MCT) for India's
 * most critical railway junctions.
 */

export interface InterStationTransfer {
  toStationCode: string;
  toStationName: string;
  distanceKm: number;
  metroRoute?: {
    lines: string;
    stationsCount: number;
    travelTimeMin: number;
    fareRs: number;
    nearestMetroStation: string;
  };
  roadTransit: {
    taxiFareRs: string;
    autoFareRs: string;
    normalDurationMin: number;
    rushHourDurationMin: number;
  };
  recommendedBufferMin: number;
  transferTip: string;
}

export interface JunctionAmenity {
  hasExecutiveLounge: boolean;
  loungeLocation?: string;
  loungeRatePerHourRs?: number;
  loungeAmenities?: string[];
  cloakroomLocation: string;
  cloakroomRatePer24hRs: number;
  cloakroomLockRequirement: string;
  retiringRooms: {
    available: boolean;
    acDormitory: boolean;
    privateRooms: boolean;
    bookingPortal: string;
  };
  foodHighlights: string[];
  wheelchairAndBuggy: boolean;
  safeNightWaitingArea: string;
}

export interface JunctionHubDetail {
  code: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  zone: string;
  platformsCount: number;
  minimumConnectionTimeMin: number; // same-station buffer
  category: "METRO_HUB" | "TRUNK_JUNCTION" | "PILGRIM_TOURISM";
  categoryLabel: string;
  overview: string;
  portals: {
    side1: { name: string; description: string; bestFor: string };
    side2: { name: string; description: string; bestFor: string };
  };
  amenities: JunctionAmenity;
  interStationTransfers?: InterStationTransfer[];
  connectingCorridors: {
    corridorName: string;
    popularTrains: string;
    searchFrom: string;
    searchTo: string;
  }[];
}

export const JUNCTIONS_DATA: JunctionHubDetail[] = [
  // 1. New Delhi (NDLS)
  {
    code: "NDLS",
    slug: "new-delhi-ndls",
    name: "New Delhi Railway Station",
    city: "New Delhi",
    state: "Delhi",
    zone: "Northern Railway (NR)",
    platformsCount: 16,
    minimumConnectionTimeMin: 40,
    category: "METRO_HUB",
    categoryLabel: "National Capital Metro Hub",
    overview:
      "India's busiest railway hub connecting northern India to Mumbai, Kolkata, Chennai, and Jammu. Handles over 400 trains daily across 16 platforms with direct underground Airport Express & Yellow Line Metro links.",
    portals: {
      side1: {
        name: "Paharganj Side (Platform 1)",
        description: "Facing Connaught Place and budget hotels. Extremely crowded road traffic.",
        bestFor: "Budget hotels, Central Delhi, walking to RK Ashram Metro.",
      },
      side2: {
        name: "Ajmeri Gate Side (Platform 16)",
        description: "Modern entrance directly linked to Airport Express Metro and Yellow Line New Delhi Metro Station.",
        bestFor: "Metro transfers, prepaid cabs, airport travelers, IRCTC Executive Lounge.",
      },
    },
    amenities: {
      hasExecutiveLounge: true,
      loungeLocation: "Platform 1 & Platform 16 (1st Floor)",
      loungeRatePerHourRs: 180,
      loungeAmenities: ["High-speed Wi-Fi", "Buffet Meals", "Recliner Sofas", "Shower Facilities"],
      cloakroomLocation: "Near Platform 1 concourse and Platform 16 Ajmeri Gate exit",
      cloakroomRatePer24hRs: 30,
      cloakroomLockRequirement: "Mandatory physical padlocks on all luggage zippers. No open bags allowed.",
      retiringRooms: {
        available: true,
        acDormitory: true,
        privateRooms: true,
        bookingPortal: "https://www.rr.irctc.co.in",
      },
      foodHighlights: ["IRCTC Jan Aahaar (PF 16)", "Comsomes Food Court (PF 1)", "Haldiram's & KFC kiosks"],
      wheelchairAndBuggy: true,
      safeNightWaitingArea: "Air-conditioned upper-class waiting hall on Platform 1 and Ajmeri Gate 1st Floor.",
    },
    interStationTransfers: [
      {
        toStationCode: "NZM",
        toStationName: "Hazrat Nizamuddin",
        distanceKm: 8,
        metroRoute: {
          lines: "Yellow Line (New Delhi → Central Secretariat) + Violet Line to Jangpura/Sarai Kale Khan",
          stationsCount: 7,
          travelTimeMin: 30,
          fareRs: 35,
          nearestMetroStation: "Sarai Kale Khan - Nizamuddin (Pink Line) or Jangpura",
        },
        roadTransit: {
          taxiFareRs: "₹180 - ₹260 (Uber/Ola)",
          autoFareRs: "₹100 - ₹150 (Prepaid Booth)",
          normalDurationMin: 25,
          rushHourDurationMin: 45,
        },
        recommendedBufferMin: 90,
        transferTip: "Take prepaid auto or cab from Ajmeri Gate (PF 16) to avoid Paharganj traffic jams.",
      },
      {
        toStationCode: "ANVT",
        toStationName: "Anand Vihar Terminal",
        distanceKm: 14,
        metroRoute: {
          lines: "Direct Blue Line Metro from nearby Rajiv Chowk to Anand Vihar ISBT",
          stationsCount: 9,
          travelTimeMin: 35,
          fareRs: 40,
          nearestMetroStation: "Anand Vihar ISBT Metro directly connected to railway concourse",
        },
        roadTransit: {
          taxiFareRs: "₹250 - ₹350",
          autoFareRs: "₹180 - ₹220",
          normalDurationMin: 35,
          rushHourDurationMin: 65,
        },
        recommendedBufferMin: 100,
        transferTip: "Blue Line Metro is 100% immune to East Delhi traffic jams; strongly prefer Metro over cabs.",
      },
      {
        toStationCode: "DLI",
        toStationName: "Delhi Junction (Old Delhi)",
        distanceKm: 4,
        metroRoute: {
          lines: "Direct Yellow Line (New Delhi → Chandni Chowk)",
          stationsCount: 2,
          travelTimeMin: 8,
          fareRs: 15,
          nearestMetroStation: "Chandni Chowk Metro Station (Gate 3 connects directly to PF 1 of Old Delhi)",
        },
        roadTransit: {
          taxiFareRs: "₹120 - ₹180",
          autoFareRs: "₹80 - ₹110",
          normalDurationMin: 15,
          rushHourDurationMin: 35,
        },
        recommendedBufferMin: 60,
        transferTip: "Take Yellow Line from New Delhi to Chandni Chowk (just 2 stops, 5 mins).",
      },
    ],
    connectingCorridors: [
      {
        corridorName: "Western Trunk (Mumbai / Gujarat via Kota)",
        popularTrains: "Mumbai Rajdhani (12952), August Kranti (12954), Paschim Express",
        searchFrom: "NDLS",
        searchTo: "MMCT",
      },
      {
        corridorName: "Eastern Trunk (Patna / Kolkata via Kanpur)",
        popularTrains: "Howrah Rajdhani (12302), Sealdah Duronto, Magadh Express",
        searchFrom: "NDLS",
        searchTo: "PNBE",
      },
    ],
  },

  // 2. Kanpur Central (CNB)
  {
    code: "CNB",
    slug: "kanpur-central-cnb",
    name: "Kanpur Central",
    city: "Kanpur",
    state: "Uttar Pradesh",
    zone: "North Central Railway (NCR)",
    platformsCount: 10,
    minimumConnectionTimeMin: 35,
    category: "TRUNK_JUNCTION",
    categoryLabel: "Grand Eastern Trunk Highway",
    overview:
      "One of the 5 busiest railway stations in India. Almost every premier train between Delhi and Howrah/Patna/Guwahati halts here. Key interchange for branching down towards Jhansi, Bhopal, and Lucknow.",
    portals: {
      side1: {
        name: "City Side (Platform 1)",
        description: "Main heritage portico facing the busy commercial market and Mall Road.",
        bestFor: "Kanpur city center, local hotels, and city buses.",
      },
      side2: {
        name: "Cantonment (Cantt) Side (Platform 10)",
        description: "Spacious entrance with large prepaid car parking and direct access to Lucknow Highway.",
        bestFor: "Fast cab pick-ups, inter-city road transfers to Lucknow, quieter waiting.",
      },
    },
    amenities: {
      hasExecutiveLounge: true,
      loungeLocation: "Platform 1, near main waiting hall",
      loungeRatePerHourRs: 150,
      loungeAmenities: ["Air Conditioning", "Sofa Seating", "Food Counter", "Mobile Charging"],
      cloakroomLocation: "Platform 1, adjacent to reservation building",
      cloakroomRatePer24hRs: 30,
      cloakroomLockRequirement: "Must have locked zipper tags with physical key padlock.",
      retiringRooms: {
        available: true,
        acDormitory: true,
        privateRooms: true,
        bookingPortal: "https://www.rr.irctc.co.in",
      },
      foodHighlights: ["Banarasi Sweet stalls", "Jan Aahaar PF 1", "Fast food outlets on PF 2/3 and PF 6/7"],
      wheelchairAndBuggy: true,
      safeNightWaitingArea: "Upper Class AC Waiting Room on Platform 1 (staffed 24/7).",
    },
    connectingCorridors: [
      {
        corridorName: "Kanpur ↔ Lucknow Fast Shuttle",
        popularTrains: "Lucknow Shatabdi (12004), Gomti Express (12420), MEMU Expresses",
        searchFrom: "CNB",
        searchTo: "LKO",
      },
      {
        corridorName: "Delhi ↔ Prayagraj / Varanasi Trunk",
        popularTrains: "Vande Bharat Express (22436), Shiv Ganga Express (12560)",
        searchFrom: "CNB",
        searchTo: "PRYJ",
      },
    ],
  },

  // 3. Mathura Junction (MTJ)
  {
    code: "MTJ",
    slug: "mathura-junction-mtj",
    name: "Mathura Junction",
    city: "Mathura",
    state: "Uttar Pradesh",
    zone: "North Central Railway (NCR)",
    platformsCount: 10,
    minimumConnectionTimeMin: 30,
    category: "PILGRIM_TOURISM",
    categoryLabel: "Braj Pilgrim & Quad-Track Interchange",
    overview:
      "A strategic 4-direction junction where the Delhi-Mumbai Western Trunk splits from the Delhi-Chennai Central Trunk. Critical interchange for pilgrims visiting Vrindavan and Govardhan.",
    portals: {
      side1: {
        name: "Platform 1 (Main City Side)",
        description: "Opens directly to city bus stand, e-rickshaws to Krishna Janmabhoomi & Vrindavan.",
        bestFor: "Pilgrims heading to Vrindavan temple circuit.",
      },
      side2: {
        name: "Platform 9/10 (Refinery Side)",
        description: "Backside entrance near highway bypass.",
        bestFor: "Quick taxi bypass towards Agra National Highway.",
      },
    },
    amenities: {
      hasExecutiveLounge: false,
      cloakroomLocation: "Platform 1, near Station Master's Office",
      cloakroomRatePer24hRs: 25,
      cloakroomLockRequirement: "Mandatory lock & chain for luggage.",
      retiringRooms: {
        available: true,
        acDormitory: true,
        privateRooms: true,
        bookingPortal: "https://www.rr.irctc.co.in",
      },
      foodHighlights: ["Famous Mathura Peda stalls on PF 1 & 2", "Pure vegetarian food stalls"],
      wheelchairAndBuggy: true,
      safeNightWaitingArea: "Main Concourse AC Waiting Room on Platform 1.",
    },
    connectingCorridors: [
      {
        corridorName: "Mathura ↔ Agra Cantt (48 km Rail Shuttle)",
        popularTrains: "Gatimaan Express (12050), Taj Express, Taj Shuttles",
        searchFrom: "MTJ",
        searchTo: "AGC",
      },
      {
        corridorName: "Mathura ↔ Kota / Mumbai Corridor",
        popularTrains: "August Kranti Rajdhani, Golden Temple Mail (12904)",
        searchFrom: "MTJ",
        searchTo: "KOTA",
      },
    ],
  },

  // 4. Itarsi Junction (ET)
  {
    code: "ET",
    slug: "itarsi-junction-et",
    name: "Itarsi Junction",
    city: "Itarsi",
    state: "Madhya Pradesh",
    zone: "West Central Railway (WCR)",
    platformsCount: 7,
    minimumConnectionTimeMin: 35,
    category: "TRUNK_JUNCTION",
    categoryLabel: "Geographic Heart of Indian Railways",
    overview:
      "The ultimate crossroad of India: where the North-South corridor (Delhi ↔ Chennai) intersects the East-West corridor (Mumbai ↔ Kolkata via Jabalpur). Over 300 express trains cross here every 24 hours.",
    portals: {
      side1: {
        name: "Platform 1 (City Side)",
        description: "Primary terminal entrance, booking office, and taxi stand.",
        bestFor: "All incoming and outgoing transfers.",
      },
      side2: {
        name: "Platform 7 Side",
        description: "Secondary access road.",
        bestFor: "Quick exit to eastern bypass.",
      },
    },
    amenities: {
      hasExecutiveLounge: false,
      cloakroomLocation: "Platform 1, beside waiting halls",
      cloakroomRatePer24hRs: 25,
      cloakroomLockRequirement: "Rigid locks required on bags.",
      retiringRooms: {
        available: true,
        acDormitory: true,
        privateRooms: true,
        bookingPortal: "https://www.rr.irctc.co.in",
      },
      foodHighlights: ["Fresh tea stalls", "IRCTC Refreshment Room on PF 1 & 2"],
      wheelchairAndBuggy: true,
      safeNightWaitingArea: "Well-lit 24/7 passenger hall on Platform 1 with RPF outpost.",
    },
    connectingCorridors: [
      {
        corridorName: "Itarsi ↔ Bhopal Hub Shuttle",
        popularTrains: "Bhopal Express, Vande Bharat, Grand Trunk Express",
        searchFrom: "ET",
        searchTo: "BPL",
      },
      {
        corridorName: "Itarsi ↔ Nagpur / Southern Junction",
        popularTrains: "Tamil Nadu Express (12622), Kerala Express (12626)",
        searchFrom: "ET",
        searchTo: "NGP",
      },
    ],
  },

  // 5. Vijayawada Junction (BZA)
  {
    code: "BZA",
    slug: "vijayawada-junction-bza",
    name: "Vijayawada Junction",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    zone: "South Central Railway (SCR)",
    platformsCount: 10,
    minimumConnectionTimeMin: 35,
    category: "TRUNK_JUNCTION",
    categoryLabel: "Gateway to Coastal Andhra & South India",
    overview:
      "A massive transit hub connecting Howrah/Visakhapatnam down to Chennai, and Hyderabad/Secunderabad across to coastal ports. Renowned for clean platforms and spacious escalator infrastructure.",
    portals: {
      side1: {
        name: "Main Entrance (Platform 1 - West)",
        description: "Grand heritage entry facing the city center and Krishna river bridges.",
        bestFor: "Bus stand transfers (PNBS is 1 km away), city hotels.",
      },
      side2: {
        name: "Tarapet Entrance (Platform 10 - East)",
        description: "Backside entrance with convenient cab drop-off and pickup.",
        bestFor: "Direct highway access and auto-rickshaws.",
      },
    },
    amenities: {
      hasExecutiveLounge: true,
      loungeLocation: "Platform 1, near main concourse",
      loungeRatePerHourRs: 150,
      loungeAmenities: ["AC Recliners", "Wi-Fi", "Coffee & Snacks", "TV Display"],
      cloakroomLocation: "Platform 1, near enquiry counters",
      cloakroomRatePer24hRs: 30,
      cloakroomLockRequirement: "Zippers must be locked with padlocks.",
      retiringRooms: {
        available: true,
        acDormitory: true,
        privateRooms: true,
        bookingPortal: "https://www.rr.irctc.co.in",
      },
      foodHighlights: ["Andhra spice meals", "Famous Idli-Vada counters", "Fruit juice bars"],
      wheelchairAndBuggy: true,
      safeNightWaitingArea: "Large air-conditioned upper class waiting hall on Platform 1.",
    },
    connectingCorridors: [
      {
        corridorName: "Vijayawada ↔ Hyderabad / Secunderabad",
        popularTrains: "Vande Bharat (20833), Satavahana Express, Godavari Express",
        searchFrom: "BZA",
        searchTo: "SC",
      },
      {
        corridorName: "Vijayawada ↔ Chennai Central Trunk",
        popularTrains: "Coromandel Express (12841), Pinakini Express",
        searchFrom: "BZA",
        searchTo: "MAS",
      },
    ],
  },

  // 6. Howrah Junction (HWH)
  {
    code: "HWH",
    slug: "howrah-junction-hwh",
    name: "Howrah Junction",
    city: "Kolkata",
    state: "West Bengal",
    zone: "Eastern Railway (ER) & South Eastern Railway (SER)",
    platformsCount: 23,
    minimumConnectionTimeMin: 45,
    category: "METRO_HUB",
    categoryLabel: "India's Largest Terminal (23 Platforms)",
    overview:
      "India's oldest and largest railway station complex with 23 platforms split across Terminal 1 (Eastern Railway) and Terminal 2 (South Eastern Railway). Connected to Kolkata city via the iconic Howrah Bridge and the new underwater Green Line Metro.",
    portals: {
      side1: {
        name: "Old Complex (Terminal 1 - Platforms 1 to 15)",
        description: "Handles Eastern Railway mainline trains towards Delhi, Patna, and Varanasi.",
        bestFor: "Rajdhani, Kalka Mail, Ferry ghats, Howrah Bridge taxis.",
      },
      side2: {
        name: "New Complex (Terminal 2 - Platforms 17 to 23)",
        description: "Handles South Eastern Railway trains towards Mumbai, Chennai, and Puri.",
        bestFor: "Coromandel Express, Gitanjali Express, Digha locals.",
      },
    },
    amenities: {
      hasExecutiveLounge: true,
      loungeLocation: "Old Complex near Platform 8 and New Complex concourse",
      loungeRatePerHourRs: 180,
      loungeAmenities: ["High speed Wi-Fi", "Buffet", "Shower facility", "Charging hubs"],
      cloakroomLocation: "Near Platform 17 (New Complex) and Platform 8 (Old Complex)",
      cloakroomRatePer24hRs: 30,
      cloakroomLockRequirement: "Mandatory lock and key.",
      retiringRooms: {
        available: true,
        acDormitory: true,
        privateRooms: true,
        bookingPortal: "https://www.rr.irctc.co.in",
      },
      foodHighlights: ["Authentic Bengali sweets (Misti Doi, Sandesh)", "Jan Aahaar", "Haldiram Food Court"],
      wheelchairAndBuggy: true,
      safeNightWaitingArea: "Spacious AC waiting hall in New Complex.",
    },
    interStationTransfers: [
      {
        toStationCode: "SDAH",
        toStationName: "Sealdah Railway Station",
        distanceKm: 5,
        metroRoute: {
          lines: "Green Line Underwater Metro (Howrah → Sealdah)",
          stationsCount: 4,
          travelTimeMin: 12,
          fareRs: 20,
          nearestMetroStation: "Howrah Metro directly underneath railway concourse",
        },
        roadTransit: {
          taxiFareRs: "₹120 - ₹180 (Yellow Taxis / Uber)",
          autoFareRs: "N/A (Autos don't cross Howrah Bridge)",
          normalDurationMin: 25,
          rushHourDurationMin: 55,
        },
        recommendedBufferMin: 60,
        transferTip: "Use the Green Line underwater metro! It takes just 12 minutes to reach Sealdah under the Hooghly river.",
      },
    ],
    connectingCorridors: [
      {
        corridorName: "Howrah ↔ Delhi Trunk",
        popularTrains: "Howrah Rajdhani (12301), Poorva Express (12303)",
        searchFrom: "HWH",
        searchTo: "NDLS",
      },
      {
        corridorName: "Howrah ↔ Mumbai Corridor",
        popularTrains: "Gitanjali Express (12860), Howrah Mumbai Mail (12810)",
        searchFrom: "HWH",
        searchTo: "CSMT",
      },
    ],
  },
];

/**
 * Helper to fetch junction by code or slug
 */
export function getJunctionBySlug(slug: string): JunctionHubDetail | undefined {
  const norm = slug.toLowerCase().trim();
  return JUNCTIONS_DATA.find(
    (j) => j.slug.toLowerCase() === norm || j.code.toLowerCase() === norm
  );
}

/**
 * Filter junctions by query or category
 */
export function searchJunctions(query: string): JunctionHubDetail[] {
  const q = query.toLowerCase().trim();
  if (!q) return JUNCTIONS_DATA;

  return JUNCTIONS_DATA.filter((j) => {
    return (
      j.code.toLowerCase().includes(q) ||
      j.name.toLowerCase().includes(q) ||
      j.city.toLowerCase().includes(q) ||
      j.state.toLowerCase().includes(q)
    );
  });
}

