import { parseAvlResponse, buildAvlKey, toAvlDate } from "../lib/erail/avl";

// This is the literal sample the user pasted from s.erail.in/getvalue.
const SAMPLE =
  "301^AVL_Response~12908_NZM_BDTS_1A_GN_17-8^NOT AVAILABLE^14-26~12908_NZM_BDTS_2A_GN_17-8^NOT AVAILABLE^14-26~12908_NZM_BDTS_3A_GN_17-8^NOT AVAILABLE^8-32~22210_NZM_MMCT_2A_GN_18-8^AVAILABLE 14^12-28~22210_NZM_MMCT_3A_GN_18-8^AVAILABLE 37^14-13~22210_NZM_MMCT_2S_GN_18-8^REGRET/GNWL12^14-13~12432_NZM_BSR_2A_GN_18-8^PQWL26/WL14^10-14~12472_NDLS_BDTS_1A_GN_18-8^RLWL3/WL3^12-0~22414_NZM_BSR_2A_GN_21-8^AVAILABLE 18^14-23~12908_NZM_BDTS_1A_GN_17-8_f^3646_60_75_0_189_0_0_0_3970_O_1366_1_Sampark Kranti_1995_0_0^14-26~12908_NZM_BDTS_2A_GN_17-8_f^2157_50_45_0_113_0_0_0_2365_O_1366_1_Sampark Kranti_1185_0_0^14-26";

const result = parseAvlResponse(SAMPLE);

console.log("=== Availability entries ===");
for (const [key, avl] of result.availability) {
  console.log(key.padEnd(30), "->", avl.category.padEnd(13), "count:", avl.count, " raw:", avl.rawStatus);
}

console.log("\n=== Fare entries ===");
for (const [key, fare] of result.fares) {
  console.log(key.padEnd(30), "-> estimatedFare:", fare.estimatedFare);
}

console.log("\n=== Sanity checks ===");
const checks: [string, boolean][] = [
  ["NOT AVAILABLE parses to NOT_AVAILABLE", result.availability.get("12908_NZM_BDTS_1A_GN_17-8")?.category === "NOT_AVAILABLE"],
  ["AVAILABLE 14 parses count=14", result.availability.get("22210_NZM_MMCT_2A_GN_18-8")?.count === 14],
  ["AVAILABLE 37 parses count=37", result.availability.get("22210_NZM_MMCT_3A_GN_18-8")?.count === 37],
  ["REGRET/GNWL12 parses to REGRET", result.availability.get("22210_NZM_MMCT_2S_GN_18-8")?.category === "REGRET"],
  ["PQWL26/WL14 parses to WAITLIST count=14", result.availability.get("12432_NZM_BSR_2A_GN_18-8")?.category === "WAITLIST" && result.availability.get("12432_NZM_BSR_2A_GN_18-8")?.count === 14],
  ["RLWL3/WL3 parses to WAITLIST count=3", result.availability.get("12472_NDLS_BDTS_1A_GN_18-8")?.category === "WAITLIST" && result.availability.get("12472_NDLS_BDTS_1A_GN_18-8")?.count === 3],
  ["fare key strips _f suffix", result.fares.has("12908_NZM_BDTS_1A_GN_17-8")],
  ["1A fare estimatedFare = 3970", result.fares.get("12908_NZM_BDTS_1A_GN_17-8")?.estimatedFare === 3970],
  ["2A fare estimatedFare = 2365", result.fares.get("12908_NZM_BDTS_2A_GN_17-8")?.estimatedFare === 2365],
  ["buildAvlKey matches sample format", buildAvlKey("12908", "NZM", "BDTS", "1A", "GN", { day: 17, month: 8 }) === "12908_NZM_BDTS_1A_GN_17-8"],
  ["toAvlDate parses ISO date correctly", JSON.stringify(toAvlDate("2026-08-17")) === JSON.stringify({ day: 17, month: 8 })],
];

let allPass = true;
for (const [label, pass] of checks) {
  console.log(pass ? "PASS" : "FAIL", "-", label);
  if (!pass) allPass = false;
}

console.log(allPass ? "\nAll checks passed." : "\nSOME CHECKS FAILED.");
process.exit(allPass ? 0 : 1);
