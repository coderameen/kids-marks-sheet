export function parseStudentFields(data: Record<string, unknown>) {
  const full_name = String(data.full_name || "").trim();
  const nick_name = String(data.nick_name || "").trim();
  const subject = String(data.subject || "").trim();
  const age = parseInt(String(data.age), 10);
  if (
    !full_name ||
    !nick_name ||
    !subject ||
    Number.isNaN(age) ||
    age < 3 ||
    age > 25
  ) {
    return null;
  }
  return { full_name, nick_name, age, subject };
}

export function periodStart(period: string) {
  const now = new Date();
  const days =
    period === "weekly" ? 7 : period === "monthly" ? 30 : period === "yearly" ? 365 : 0;
  if (!days) return null;
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString().slice(0, 10);
}
