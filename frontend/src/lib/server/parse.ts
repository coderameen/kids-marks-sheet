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
