import { DEFAULT_HUBS } from "./graph/hubs";

export interface StationCoord {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

const EXTRA_COORDS: StationCoord[] = [
  { code: "BCT", name: "Mumbai Central", lat: 18.97, lon: 72.82 },
  { code: "CSMT", name: "Mumbai CSMT", lat: 18.94, lon: 72.84 },
  { code: "BDTS", name: "Bandra Terminus", lat: 19.06, lon: 72.84 },
  { code: "MMCT", name: "Mumbai Central", lat: 18.97, lon: 72.82 },
  { code: "DDR", name: "Dadar", lat: 19.02, lon: 72.84 },
  { code: "PUNE", name: "Pune Jn", lat: 18.53, lon: 73.87 },
  { code: "SBC", name: "Bengaluru City (KSR)", lat: 12.98, lon: 77.57 },
  { code: "MAS", name: "Chennai Central", lat: 13.08, lon: 80.28 },
  { code: "HWH", name: "Howrah Jn", lat: 22.58, lon: 88.34 },
  { code: "SC", name: "Secunderabad Jn", lat: 17.43, lon: 78.5 },
  { code: "ADI", name: "Ahmedabad Jn", lat: 23.03, lon: 72.6 },
  { code: "PNBE", name: "Patna Jn", lat: 25.61, lon: 85.14 },
  { code: "BBS", name: "Bhubaneswar", lat: 20.27, lon: 85.83 },
  { code: "GHY", name: "Guwahati", lat: 26.18, lon: 91.75 },
  { code: "TVC", name: "Thiruvananthapuram Central", lat: 8.49, lon: 76.95 },
  { code: "ERS", name: "Ernakulam Jn", lat: 9.98, lon: 76.29 },
  { code: "MAO", name: "Madgaon, Goa", lat: 15.27, lon: 73.96 },
  { code: "UDZ", name: "Udaipur City", lat: 24.58, lon: 73.68 },
  { code: "NGP", name: "Nagpur Jn", lat: 21.15, lon: 79.09 },
  { code: "VSKP", name: "Visakhapatnam", lat: 17.72, lon: 83.3 },
  { code: "TPTY", name: "Tirupati", lat: 13.63, lon: 79.42 },
  { code: "MYS", name: "Mysuru Jn", lat: 12.31, lon: 76.65 },
  { code: "CBE", name: "Coimbatore Jn", lat: 11.0, lon: 76.96 },
  { code: "MDU", name: "Madurai Jn", lat: 9.92, lon: 78.12 },
  { code: "PNVL", name: "Panvel", lat: 18.99, lon: 73.12 },
  { code: "VR", name: "Vasai Road Jn", lat: 19.4, lon: 72.83 },
  { code: "BSR", name: "Vasai Road", lat: 19.4, lon: 72.83 },
  { code: "TNA", name: "Thane", lat: 19.19, lon: 72.97 },
  { code: "KYN", name: "Kalyan Jn", lat: 19.24, lon: 73.13 },
  { code: "BVI", name: "Borivali", lat: 19.23, lon: 72.86 },
  { code: "LTT", name: "Lokmanya Tilak Terminus", lat: 19.08, lon: 72.89 },
  { code: "LNL", name: "Lonavala", lat: 18.75, lon: 73.41 },
  { code: "KJT", name: "Karjat", lat: 18.91, lon: 73.32 },
  { code: "CCH", name: "Chinchwad", lat: 18.65, lon: 73.8 },
  { code: "MMR", name: "Manmad Jn", lat: 20.25, lon: 74.44 },
  { code: "BIRD", name: "Bhivandi Road", lat: 19.28, lon: 73.06 },
  { code: "VAPI", name: "Vapi", lat: 20.37, lon: 72.91 },
  { code: "BL", name: "Valsad", lat: 20.6, lon: 72.93 },
  { code: "CYI", name: "Chandlodiya", lat: 23.09, lon: 72.58 },
];

const CITY_COORDS: { name: string; aliases: string[]; lat: number; lon: number }[] = [
  { name: "Delhi", aliases: ["NEW DELHI", "DELHI", "NDLS", "DLI", "NZM", "ANVT", "OLD DELHI", "KASHMIRI GATE"], lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", aliases: ["MUMBAI", "BOMBAY", "BCT", "CSMT", "BDTS", "MMCT", "DDR", "MUMBAI CENTRAL", "BORIVALI", "THANE", "DADAR"], lat: 18.97, lon: 72.82 },
  { name: "Pune", aliases: ["PUNE", "POONA", "PUNE JN", "SWARGATE", "SHIVAJI NAGAR", "WAKAD"], lat: 18.5204, lon: 73.8567 },
  { name: "Bengaluru", aliases: ["BENGALURU", "BANGALORE", "SBC", "YPR", "SMVB", "MAJESTIC", "ELECTRONIC CITY"], lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", aliases: ["HYDERABAD", "SECUNDERABAD", "SC", "HYB", "KCG", "MGBS", "JBS"], lat: 17.385, lon: 78.4867 },
  { name: "Chennai", aliases: ["CHENNAI", "MADRAS", "MAS", "MS", "TBM", "CMBT", "KOYAMBEDU"], lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", aliases: ["KOLKATA", "CALCUTTA", "HWH", "SDAH", "KOAA", "HOWRAH", "ESPLANADE"], lat: 22.5726, lon: 88.3639 },
  { name: "Ahmedabad", aliases: ["AHMEDABAD", "ADI", "SBT", "GITA MANDIR", "PALDI"], lat: 23.0225, lon: 72.5714 },
  { name: "Jaipur", aliases: ["JAIPUR", "JP", "DPA", "SINDHI CAMP"], lat: 26.9124, lon: 75.7873 },
  { name: "Surat", aliases: ["SURAT", "ST", "KAMREJ"], lat: 21.1702, lon: 72.8311 },
  { name: "Vadodara", aliases: ["VADODARA", "BARODA", "BRC", "CENTRAL BUS STAND"], lat: 22.3072, lon: 73.1812 },
  { name: "Kota", aliases: ["KOTA", "KOTA JN", "NAYA NOHRA"], lat: 25.2138, lon: 75.8648 },
  { name: "Bhopal", aliases: ["BHOPAL", "BPL", "RKMP", "HABIBGANJ", "NADRA"], lat: 23.2599, lon: 77.4126 },
  { name: "Indore", aliases: ["INDORE", "INDB", "SARWATE", "AICTSL"], lat: 22.7196, lon: 75.8577 },
  { name: "Lucknow", aliases: ["LUCKNOW", "LKO", "LJN", "ALAMBAGH", "CHARBAGH"], lat: 26.8467, lon: 80.9462 },
  { name: "Kanpur", aliases: ["KANPUR", "CNB", "JHAKARKATI"], lat: 26.4499, lon: 80.3319 },
  { name: "Agra", aliases: ["AGRA", "AGC", "AF", "ISBT AGRA", "IDGAH"], lat: 27.1767, lon: 78.0081 },
  { name: "Varanasi", aliases: ["VARANASI", "BSB", "DDU", "BANARAS", "KASHI", "CANTT BUS STAND"], lat: 25.3176, lon: 82.9739 },
  { name: "Patna", aliases: ["PATNA", "PNBE", "PPTA", "MEETHAPUR", "BAIRITY"], lat: 25.5941, lon: 85.1376 },
  { name: "Chandigarh", aliases: ["CHANDIGARH", "CDG", "SECTOR 17", "SECTOR 43"], lat: 30.7333, lon: 76.7794 },
  { name: "Amritsar", aliases: ["AMRITSAR", "ASR"], lat: 31.634, lon: 74.8723 },
  { name: "Nagpur", aliases: ["NAGPUR", "NGP", "GANESHPETH"], lat: 21.1458, lon: 79.0882 },
  { name: "Coimbatore", aliases: ["COIMBATORE", "CBE", "GANDHIPURAM"], lat: 11.0168, lon: 76.9558 },
  { name: "Madurai", aliases: ["MADURAI", "MDU", "MATTUTHAVANI"], lat: 9.9252, lon: 78.1198 },
  { name: "Mysuru", aliases: ["MYSURU", "MYSORE", "MYS", "SUBURBAN BUS STAND"], lat: 12.2958, lon: 76.6394 },
  { name: "Kochi", aliases: ["KOCHI", "COCHIN", "ERS", "ERN", "VYTILLA"], lat: 9.9312, lon: 76.2673 },
  { name: "Thiruvananthapuram", aliases: ["THIRUVANANTHAPURAM", "TRIVANDRUM", "TVC", "THAMPANOOR"], lat: 8.5241, lon: 76.9366 },
  { name: "Goa", aliases: ["GOA", "MADGAON", "MAO", "VASCO", "PANJIM", "PANAJI", "MAPUSA"], lat: 15.2993, lon: 74.124 },
  { name: "Visakhapatnam", aliases: ["VISAKHAPATNAM", "VIZAG", "VSKP", "DWARAKA BUS STAND"], lat: 17.6868, lon: 83.2185 },
  { name: "Vijayawada", aliases: ["VIJAYAWADA", "BZA", "PNBS"], lat: 16.5062, lon: 80.648 },
  { name: "Tirupati", aliases: ["TIRUPATI", "TPTY", "CENTRAL BUS STATION"], lat: 13.6288, lon: 79.4192 },
  { name: "Bhubaneswar", aliases: ["BHUBANESWAR", "BBS", "BARAMUNDA"], lat: 20.2961, lon: 85.8245 },
  { name: "Guwahati", aliases: ["GUWAHATI", "GHY", "ISBT BETKUCHI"], lat: 26.1445, lon: 91.7362 },
  { name: "Dehradun", aliases: ["DEHRADUN", "DDN", "ISBT DEHRADUN"], lat: 30.3165, lon: 78.0322 },
  { name: "Haridwar", aliases: ["HARIDWAR", "HW"], lat: 29.9457, lon: 78.1642 },
  { name: "Rishikesh", aliases: ["RISHIKESH", "YNRK"], lat: 30.0869, lon: 78.2676 },
  { name: "Jodhpur", aliases: ["JODHPUR", "JU"], lat: 26.2389, lon: 73.0243 },
  { name: "Udaipur", aliases: ["UDAIPUR", "UDZ", "UDIAPOLE"], lat: 24.5854, lon: 73.7125 },
  { name: "Gwalior", aliases: ["GWALIOR", "GWL"], lat: 26.2183, lon: 78.1828 },
  { name: "Jhansi", aliases: ["JHANSI", "VGLJ"], lat: 25.4484, lon: 78.5685 },
  { name: "Jabalpur", aliases: ["JABALPUR", "JBP"], lat: 23.1815, lon: 79.9864 },
  { name: "Nashik", aliases: ["NASHIK", "NASIK", "NK", "CBS NASHIK"], lat: 19.9975, lon: 73.7898 },
  { name: "Shirdi", aliases: ["SHIRDI", "SNSI"], lat: 19.7667, lon: 74.4767 },
  { name: "Aurangabad", aliases: ["AURANGABAD", "CHHATRAPATI SAMBHAJINAGAR", "AWB", "CIDCO"], lat: 19.8762, lon: 75.3433 },
  { name: "Solapur", aliases: ["SOLAPUR", "SUR"], lat: 17.6599, lon: 75.9064 },
  { name: "Kolhapur", aliases: ["KOLHAPUR", "KOP"], lat: 16.705, lon: 74.2433 },
  { name: "Ratlam", aliases: ["RATLAM", "RTM"], lat: 23.3315, lon: 75.0367 },
  { name: "Ujjain", aliases: ["UJJAIN", "UJN"], lat: 23.1765, lon: 75.7885 },
  { name: "Mathura", aliases: ["MATHURA", "MTJ"], lat: 27.4924, lon: 77.6737 },
  { name: "Bareilly", aliases: ["BAREILLY", "BE"], lat: 28.367, lon: 79.4304 },
  { name: "Gorakhpur", aliases: ["GORAKHPUR", "GKP"], lat: 26.7606, lon: 83.3732 },
  { name: "Prayagraj", aliases: ["PRAYAGRAJ", "ALLAHABAD", "PRYJ", "CIVIL LINES"], lat: 25.4358, lon: 81.8463 },
  { name: "Shimla", aliases: ["SHIMLA", "SML", "ISBT TUTIKANDI"], lat: 31.1048, lon: 77.1734 },
  { name: "Manali", aliases: ["MANALI", "PRIVATE BUS STAND"], lat: 32.2432, lon: 77.1892 },
  { name: "Dharamshala", aliases: ["DHARAMSHALA", "DHARAMSALA", "MCLEODGANJ"], lat: 32.219, lon: 76.3234 },
  { name: "Rajkot", aliases: ["RAJKOT", "RJT"], lat: 22.3039, lon: 70.8022 },
  { name: "Bhavnagar", aliases: ["BHAVNAGAR", "BVC"], lat: 21.7645, lon: 72.1519 },
  { name: "Jamnagar", aliases: ["JAMNAGAR", "JAM"], lat: 22.4707, lon: 70.0577 },
];

const COORD_MAP: Map<string, StationCoord> = (() => {
  const m = new Map<string, StationCoord>();
  for (const h of DEFAULT_HUBS) m.set(h.code, { code: h.code, name: h.name, lat: h.lat, lon: h.lon });
  for (const s of EXTRA_COORDS) m.set(s.code, s);
  return m;
})();

const ALIAS_MAP: Map<string, StationCoord> = (() => {
  const m = new Map<string, StationCoord>();
  for (const city of CITY_COORDS) {
    const coord: StationCoord = {
      code: city.aliases[0],
      name: city.name,
      lat: city.lat,
      lon: city.lon,
    };
    m.set(city.name.toUpperCase(), coord);
    for (const alias of city.aliases) {
      m.set(alias.toUpperCase(), coord);
    }
  }
  return m;
})();

/**
 * Looks up known lat/lon for any railway station code OR city/bus location name.
 * Robust against variations like "Delhi ISBT", "Mumbai Central", "Pune", "NDLS", etc.
 */
export function getStationCoord(input: string): StationCoord | null {
  if (!input) return null;
  const raw = input.trim().toUpperCase();

  // 1. Direct station code lookup
  const direct = COORD_MAP.get(raw);
  if (direct) return direct;

  // 2. City or alias lookup
  const alias = ALIAS_MAP.get(raw);
  if (alias) return alias;

  // 3. Clean common bus/station suffixes and try again
  const cleaned = raw
    .replace(/\b(ISBT|BUS STAND|BUS STOP|BUS TERMINAL|TERMINAL|TERMINUS|JN|JUNCTION|CANTT|CENTRAL|MAIN|CITY|AIRPORT|RAILWAY STATION)\b/gi, "")
    .replace(/[^\w\s]/g, "")
    .trim();

  if (cleaned) {
    if (COORD_MAP.has(cleaned)) return COORD_MAP.get(cleaned)!;
    if (ALIAS_MAP.has(cleaned)) return ALIAS_MAP.get(cleaned)!;
  }

  // 4. Substring matching for major cities (e.g. "Delhi ISBT Kashmiri Gate" -> Delhi)
  for (const [key, coord] of ALIAS_MAP.entries()) {
    if (key.length >= 4 && (raw.includes(key) || (cleaned && cleaned.includes(key)))) {
      return coord;
    }
  }

  return null;
}

/** Registers/overrides a coordinate at runtime */
export function registerStationCoord(coord: StationCoord): void {
  if (!COORD_MAP.has(coord.code)) COORD_MAP.set(coord.code, coord);
  ALIAS_MAP.set(coord.code.toUpperCase(), coord);
  ALIAS_MAP.set(coord.name.toUpperCase(), coord);
}
