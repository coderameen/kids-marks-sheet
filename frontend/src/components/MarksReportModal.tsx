"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MarksReport } from "@/types";

const periodLabels = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function MarksReportModal({
  period,
  open,
  onClose,
  studentId,
  studentName,
  title,
}: {
  period: "weekly" | "monthly" | "yearly" | null;
  open: boolean;
  onClose: () => void;
  studentId?: number | null;
  studentName?: string;
  title?: string;
}) {
  const [report, setReport] = useState<MarksReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !period) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setReport(null);

    (async () => {
      try {
        // Student-scoped report: use the same student endpoint as profile history
        // so deletes always match what the report shows.
        if (studentId != null) {
          const [{ periodStart, todayUtc }, studentRes] = await Promise.all([
            import("@/lib/period"),
            api.getStudent(studentId),
          ]);
          const start = periodStart(period);
          if (!start) throw new Error("Invalid period");
          const entries = studentRes.entries
            .filter((e) => e.entry_date >= start)
            .map((e) => ({
              student_id: studentRes.student.id,
              full_name: studentRes.student.full_name,
              nick_name: studentRes.student.nick_name,
              age: studentRes.student.age,
              subject: studentRes.student.subject,
              entry_date: e.entry_date,
              questions_count: e.questions_count,
              points: e.points,
              note: e.note || "",
            }));
          if (cancelled) return;
          setReport({
            period,
            from_date: start,
            to_date: todayUtc(),
            entries,
            entry_count: entries.length,
            total_points: entries.reduce((s, e) => s + e.points, 0),
          });
        } else {
          const data = await api.getMarksReport(period);
          if (cancelled) return;
          setReport(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, period, studentId]);

  if (!open || !period) return null;

  const heading =
    title ||
    (studentName
      ? `${studentName} — report`
      : `📊 ${periodLabels[period]} marks report`);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-4 border-violet-300 bg-white shadow-2xl sm:max-w-4xl sm:rounded-3xl"
        role="dialog"
        aria-labelledby="report-title"
      >
        <div className="border-b border-violet-100 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
                View only · no download
              </p>
              <h2
                id="report-title"
                className="font-display text-xl font-bold text-slate-800 sm:text-2xl"
              >
                {heading}
              </h2>
              {report && (
                <p className="mt-1 text-sm text-slate-500">
                  {report.from_date} → {report.to_date} · {report.entry_count}{" "}
                  entries · {report.total_points} total points
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-300 border-t-violet-600" />
            </div>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
          )}
          {!loading && !error && report && report.entries.length === 0 && (
            <p className="rounded-2xl bg-violet-50 p-8 text-center text-slate-600">
              No marks in this {periodLabels[period].toLowerCase()} period yet.
            </p>
          )}
          {!loading && !error && report && report.entries.length > 0 && (
            <>
              <div className="space-y-3 md:hidden">
                {report.entries.map((e, i) => (
                  <article
                    key={`${e.student_id}-${e.entry_date}-${e.points}-${i}`}
                    className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 text-sm"
                  >
                    {studentId == null && (
                      <>
                        <p className="font-display font-bold text-slate-800">
                          {e.nick_name}{" "}
                          <span className="font-normal text-slate-500">
                            ({e.full_name})
                          </span>
                        </p>
                        <p className="text-slate-600">
                          Age {e.age} · {e.subject}
                        </p>
                      </>
                    )}
                    <p className="mt-2 font-semibold text-slate-800">
                      📅 {e.entry_date}
                    </p>
                    {e.note ? (
                      <p className="text-slate-600">Topic: {e.note}</p>
                    ) : null}
                    <p className="text-slate-600">
                      {e.questions_count} questions · {e.points} points
                    </p>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-xl border border-violet-100 md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-violet-50 text-xs uppercase text-slate-500">
                    <tr>
                      {studentId == null && (
                        <>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Age</th>
                          <th className="px-4 py-3">Subject</th>
                        </>
                      )}
                      <th className="px-4 py-3">Topic</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Questions</th>
                      <th className="px-4 py-3">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50">
                    {report.entries.map((e, i) => (
                      <tr
                        key={`${e.student_id}-${e.entry_date}-${e.points}-${i}`}
                      >
                        {studentId == null && (
                          <>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{e.nick_name}</p>
                              <p className="text-slate-500">{e.full_name}</p>
                            </td>
                            <td className="px-4 py-3">{e.age}</td>
                            <td className="px-4 py-3">{e.subject}</td>
                          </>
                        )}
                        <td className="px-4 py-3">{e.note || "—"}</td>
                        <td className="px-4 py-3">{e.entry_date}</td>
                        <td className="px-4 py-3">{e.questions_count}</td>
                        <td className="px-4 py-3 font-bold text-violet-600">
                          {e.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
