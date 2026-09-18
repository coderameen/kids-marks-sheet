"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CelebrationBackdrop,
  WinnersBanner,
} from "@/components/LeaderboardCelebration";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";

const medals = ["🥇", "🥈", "🥉"];

function LeaderboardRow({
  row,
  isWinner,
  coWin,
  showLinks,
  studentBasePath,
}: {
  row: LeaderboardEntry;
  isWinner: boolean;
  coWin: boolean;
  showLinks: boolean;
  studentBasePath: string;
}) {
  const medal = row.rank <= 3 ? medals[row.rank - 1] : `#${row.rank}`;

  const inner = (
    <div
      className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 p-4 shadow-sm transition active:scale-[0.99] sm:gap-4 sm:hover:shadow-md ${
        isWinner
          ? "winner-card border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 shadow-amber-200/60"
          : row.rank === 2
            ? "border-slate-200 bg-gradient-to-r from-slate-50 to-white"
            : row.rank === 3
              ? "border-orange-200 bg-gradient-to-r from-orange-50/80 to-white"
              : "border-violet-100 bg-white"
      }`}
    >
      {isWinner && (
        <span className="winner-ribbon pointer-events-none absolute -right-8 top-3 rotate-45 bg-gradient-to-r from-amber-500 to-pink-500 px-10 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          {coWin ? "Co-winner" : "Winner"}
        </span>
      )}

      <span
        className={`w-12 shrink-0 text-center text-2xl font-bold ${isWinner ? "animate-trophy-bounce" : ""}`}
      >
        {isWinner ? "🏆" : medal}
      </span>
      <StudentAvatar
        studentId={row.id}
        nickName={row.nick_name}
        hasPhoto={row.has_photo}
        size="md"
        winner={isWinner}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-bold text-slate-800">
          {row.nick_name}
          <span className="ml-1 hidden text-sm font-normal text-slate-500 sm:inline">
            ({row.full_name})
          </span>
        </p>
        <p className="text-sm text-slate-500">
          {row.subject} · Age {row.age}
        </p>
        {isWinner && (
          <p className="mt-0.5 text-xs font-bold text-amber-700">
            {coWin ? "🎈 Shared victory!" : "🌟 Star champion!"}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`font-display text-2xl font-bold ${isWinner ? "text-amber-600 animate-sparkle" : "text-violet-600"}`}
        >
          {row.total_points}
        </p>
        <p className="text-xs text-slate-400">star points</p>
      </div>
    </div>
  );

  if (showLinks) {
    return (
      <NextLink href={`${studentBasePath}/${row.id}`} className="block">
        {inner}
      </NextLink>
    );
  }
  return inner;
}

export default function LeaderboardPanel({
  studentBasePath = "/student",
  showLinks = true,
}: {
  studentBasePath?: string;
  showLinks?: boolean;
}) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLeaderboard()
      .then((r) => setBoard(r.leaderboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const winners = useMemo(
    () => board.filter((r) => r.rank === 1 && r.total_points > 0),
    [board]
  );
  const coWin = winners.length > 1;
  const showCelebration = winners.length > 0;
  const winnerIds = useMemo(
    () => new Set(winners.map((w) => w.id)),
    [winners]
  );
  const rest = board.filter((r) => !winnerIds.has(r.id));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
    );
  }

  if (board.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-violet-200 bg-white p-12 text-center">
        <p className="text-5xl">🌱</p>
        <p className="mt-4 font-display text-xl font-bold text-slate-700">
          No stars yet!
        </p>
        <p className="text-slate-500">Students will appear here once they join.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showCelebration && (
        <div className="relative">
          <CelebrationBackdrop active />
          <WinnersBanner
            count={winners.length}
            points={winners[0]?.total_points ?? 0}
          />
          <div className="relative space-y-3">
            {winners.map((row) => (
              <LeaderboardRow
                key={row.id}
                row={row}
                isWinner
                coWin={coWin}
                showLinks={showLinks}
                studentBasePath={studentBasePath}
              />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-3">
          {showCelebration && (
            <p className="px-1 text-sm font-semibold text-slate-500">
              Also racing up the board 🚀
            </p>
          )}
          {rest.map((row) => (
            <LeaderboardRow
              key={row.id}
              row={row}
              isWinner={false}
              coWin={false}
              showLinks={showLinks}
              studentBasePath={studentBasePath}
            />
          ))}
        </div>
      )}

      {!showCelebration && board.every((b) => b.total_points === 0) && (
        <p className="rounded-xl bg-violet-50 px-4 py-3 text-center text-sm text-violet-700">
          Points haven&apos;t started yet — first stars will trigger the winner
          celebration! ⭐
        </p>
      )}
    </div>
  );
}
