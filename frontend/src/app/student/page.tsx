"use client";

import Link from "next/link";
import LeaderboardPanel from "@/components/LeaderboardPanel";

export default function StudentPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-100 via-purple-50 to-pink-100">
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500">
              Student zone
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
              Leaderboard
            </h1>
          </div>
          <Link
            href="/"
            className="min-h-[44px] shrink-0 rounded-xl bg-violet-100 px-4 py-2 text-sm font-bold leading-[44px] text-violet-700 sm:leading-normal"
          >
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <LeaderboardPanel />
      </main>
    </div>
  );
}
