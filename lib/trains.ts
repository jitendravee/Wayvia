export interface TrainSummary {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
}

/**
 * Small curated list of well-known trains, used as (a) instant local
 * suggestions before/while the live erail.in lookup responds, (b) a
 * fallback if that live lookup fails or is unreachable, and (c) the
 * "popular trains" list on the landing page. Not a full timetable dump —
 * just enough for a good first-run experience and a safety net.
 */
export const POPULAR_TRAINS: TrainSummary[] = [
  { trainNo: "10103", trainName: "MANDOVI EXPRESS", from: "CSMT", to: "MAO" },
  { trainNo: "12951", trainName: "MUMBAI RAJDHANI", from: "BCT", to: "NDLS" },
  { trainNo: "12301", trainName: "HOWRAH RAJDHANI", from: "HWH", to: "NDLS" },
  { trainNo: "12009", trainName: "SHATABDI EXPRESS", from: "MAS", to: "SBC" },
  { trainNo: "12621", trainName: "TAMIL NADU EXPRESS", from: "NDLS", to: "MAS" },
  { trainNo: "12626", trainName: "KERALA EXPRESS", from: "NDLS", to: "TVC" },
  { trainNo: "12925", trainName: "PASCHIM EXPRESS", from: "BDTS", to: "ASR" },
  { trainNo: "12723", trainName: "TELANGANA EXPRESS", from: "NDLS", to: "HYB" },
  { trainNo: "12841", trainName: "COROMANDEL EXPRESS", from: "HWH", to: "MAS" },
  { trainNo: "12002", trainName: "BHOPAL SHATABDI", from: "NDLS", to: "BPL" },
  { trainNo: "12259", trainName: "SEALDAH DURONTO", from: "NDLS", to: "SDAH" },
  { trainNo: "22691", trainName: "RAJDHANI EXPRESS", from: "SBC", to: "NDLS" },
  { trainNo: "12429", trainName: "RAJDHANI EXPRESS", from: "SC", to: "NZM" },
  { trainNo: "11005", trainName: "PUDUCHERRY EXPRESS", from: "DR", to: "PDY" },
  { trainNo: "12615", trainName: "GRAND TRUNK EXPRESS", from: "MAS", to: "NDLS" },
  { trainNo: "12137", trainName: "PUNJAB MAIL", from: "CSMT", to: "FZR" },
  { trainNo: "12809", trainName: "HOWRAH MAIL", from: "HWH", to: "CSMT" },
  { trainNo: "16031", trainName: "ANDAMAN EXPRESS", from: "MS", to: "JAT" },
  { trainNo: "12903", trainName: "GOLDEN TEMPLE MAIL", from: "CSMT", to: "ASR" },
  { trainNo: "12649", trainName: "KARNATAKA SAMPARK KRANTI", from: "SBC", to: "NZM" },
];

export function searchLocalTrains(query: string, limit = 8): TrainSummary[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const scored = POPULAR_TRAINS.map((t) => {
    let score = -1;
    if (t.trainNo === q) score = 100;
    else if (t.trainNo.startsWith(q)) score = 80;
    else if (t.trainName.toUpperCase().startsWith(q)) score = 60;
    else if (t.trainName.toUpperCase().includes(q)) score = 40;
    return { t, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.t);
}
