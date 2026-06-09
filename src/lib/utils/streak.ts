/** Calendar day in UTC as YYYY-MM-DD. */
export function toActivityDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive-day study streak. The streak stays alive if the most recent
 * activity was today or yesterday; then we walk backward one day at a time.
 */
export function computeStreakDays(activityDates: string[]): number {
  if (activityDates.length === 0) return 0;

  const unique = [...new Set(activityDates)].sort((a, b) => b.localeCompare(a));
  const today = toActivityDateKey();
  const yesterday = toActivityDateKey(new Date(Date.now() - 86_400_000));

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${unique[i - 1]}T00:00:00.000Z`);
    const curr = new Date(`${unique[i]}T00:00:00.000Z`);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}
