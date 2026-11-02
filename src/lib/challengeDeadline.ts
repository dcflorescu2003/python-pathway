/** Today's date (YYYY-MM-DD) in Romania's timezone. */
export function todayInBucharest(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(now);
}

/** A challenge expires after the end of its due day (Bucharest time). No due date = never expires. */
export function isChallengeExpired(dueDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!dueDate) return false;
  return dueDate < todayInBucharest(now);
}

export function isLastDay(dueDate: string | null | undefined, now: Date = new Date()): boolean {
  return !!dueDate && dueDate === todayInBucharest(now);
}

export function formatDueDate(dueDate: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}
