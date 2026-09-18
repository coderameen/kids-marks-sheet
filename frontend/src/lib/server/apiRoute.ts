import { NextResponse } from "next/server";

export function apiError(e: unknown, logLabel: string) {
  console.error(logLabel, e);
  const message = e instanceof Error ? e.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 503 });
}
