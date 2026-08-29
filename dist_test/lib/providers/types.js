/** Tiny deterministic PRNG so the same (from, to, date, mode) always returns the same mock schedule — stable for demos and tests, not just random noise on every request. */
export function seededRandom(seedStr) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++)
        seed = (Math.imul(seed, 31) + seedStr.charCodeAt(i)) | 0;
    return function next() {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        return ((seed >>> 0) % 1000000) / 1000000;
    };
}
/** Minutes since midnight -> erail-style 'HH.MM' (matches how live train legs are formatted). */
export function minutesToHHMM(min) {
    const m = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
}
