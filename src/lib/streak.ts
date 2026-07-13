/** Count consecutive days (ending today or yesterday) that have at least one entry. */
export function calcStreak(dates: (string | Date)[], now: Date = new Date()): number {
  if (dates.length === 0) return 0;
  const days = new Set(
    dates.map((d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    }),
  );
  const key = (dt: Date) => `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;

  const cursor = new Date(now);
  // Streak may start today or yesterday (today not logged yet still keeps streak alive)
  if (!days.has(key(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(key(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
