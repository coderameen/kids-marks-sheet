/**
 * In the browser we always call same-origin `/api/...` (proxied by Next.js rewrites).
 * This avoids calling localhost from a public Vercel URL, which triggers
 * "access other apps on this device" prompts and load failures.
 */
export function apiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  const url =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:5000";
  return url.replace(/\/$/, "");
}
