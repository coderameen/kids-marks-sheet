"use client";

import { useEffect, useMemo, useState } from "react";
import MarksReportModal from "@/components/MarksReportModal";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { LeaderboardEntry, PointEntry } from "@/types";

function comparisonLabel(
  points: number,
  maxPoints: number,
  tiedAtTop: boolean
): string {
  if (maxPoints <= 0) return "No points yet";
  if (points === maxPoints) {
    return tiedAtTop ? "Tied for lead" : "Leading";
  }
  const gap = maxPoints - points;
  return `Behind by ${gap}`;
}

function LeaderboardCard({
  row,
  result,
}: {
  row: LeaderboardEntry;
  result: string;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [entries, setEntries] = useState<PointEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  async function toggleHistory() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (entries) return;
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const res = await api.getStudent(row.id);
      setEntries(res.entries);
    } catch (e) {
      setHistoryError(
        e instanceof Error ? e.message : "Could not load history"
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-center text-center">
        <StudentAvatar
          studentId={row.id}
          nickName={row.nick_name}
          hasPhoto={row.has_photo}
          size="lg"
        />
        <h3 className="mt-3 truncate text-base font-semibold text-slate-900 sm:text-lg">
          {row.nick_name}
        </h3>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
          {row.total_points}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Total points
        </p>
        <p className="mt-2 text-sm text-slate-600">{result}</p>
      </div>

      <button
        type="button"
        onClick={toggleHistory}
        className="mt-4 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        {open ? "Hide" : "Show"}
      </button>

      <button
        type="button"
        onClick={() => setReportOpen(true)}
        className="mt-2 min-h-[44px] w-full rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:border-violet-300 hover:text-violet-700"
      >
        📊 View Report
      </button>

      {open && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Points by date
          </p>
          {loadingHistory && (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
            </div>
          )}
          {historyError && (
            <p className="mt-2 text-sm text-red-600">{historyError}</p>
          )}
          {!loadingHistory && !historyError && entries && entries.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">No points recorded yet.</p>
          )}
          {!loadingHistory && !historyError && entries && entries.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-64">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{e.entry_date}</p>
                    {e.note ? (
                      <p className="truncate text-xs text-slate-500">{e.note}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    +{e.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <MarksReportModal
        period="yearly"
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        studentId={row.id}
        studentName={row.nick_name}
        title="📊 View Report"
      />
    </article>
  );
}

export default function LeaderboardPanel({
  studentBasePath: _studentBasePath = "/student",
  showLinks: _showLinks = true,
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

  const maxPoints = useMemo(
    () => Math.max(0, ...board.map((b) => b.total_points)),
    [board]
  );
  const tiedAtTop = useMemo(() => {
    if (maxPoints <= 0) return false;
    return board.filter((b) => b.total_points === maxPoints).length > 1;
  }, [board, maxPoints]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  }

  if (board.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-base font-semibold text-slate-700">No students yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Students will appear here once they join.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {board.map((row) => (
        <LeaderboardCard
          key={row.id}
          row={row}
          result={comparisonLabel(row.total_points, maxPoints, tiedAtTop)}
        />
      ))}
    </div>
  );
}
