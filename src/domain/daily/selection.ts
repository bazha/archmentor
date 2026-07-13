/** Deterministic FNV-1a hash of the date string. Pure — no Date/Math.random. */
function hashDate(dateISO: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateISO.length; i++) {
    h ^= dateISO.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // force unsigned 32-bit
}

/**
 * The day's question: deterministic by calendar date (`YYYY-MM-DD`). The same date
 * always yields the same item (stable within a day); a new day picks a new one.
 * Returns `undefined` when the pool is empty.
 */
export function selectDailyQuestion<T>(questions: T[], dateISO: string): T | undefined {
  if (questions.length === 0) return undefined;
  return questions[hashDate(dateISO) % questions.length];
}
