/** Inclusive start date (YYYY-MM-DD) for weekly / monthly / yearly windows. */
export function periodStart(period: string): string | null {
  const now = new Date();
  const days =
    period === "weekly" ? 7 : period === "monthly" ? 30 : period === "yearly" ? 365 : 0;
  if (!days) return null;
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString().slice(0, 10);
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
