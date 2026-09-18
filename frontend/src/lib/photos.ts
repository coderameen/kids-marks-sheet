const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export function studentPhotoUrl(studentId: number, cacheKey?: string | number) {
  const q = cacheKey != null ? `?v=${encodeURIComponent(String(cacheKey))}` : "";
  return `${API_BASE}/api/students/${studentId}/photo${q}`;
}
