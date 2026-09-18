import { apiBase } from "@/lib/apiBase";

export function studentPhotoUrl(studentId: number, cacheKey?: string | number) {
  const q = cacheKey != null ? `?v=${encodeURIComponent(String(cacheKey))}` : "";
  return `${apiBase()}/api/students/${studentId}/photo${q}`;
}
