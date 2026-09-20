"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { PointEntry, Student } from "@/types";

export default function StudentProfilePage() {
  const params = useParams();
  const id = Number(params.id);
  const [student, setStudent] = useState<Student | null>(null);
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    api
      .getStudent(id)
      .then((r) => {
        setStudent(r.student);
        setEntries(r.entries);
        setTotal(r.total_points);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-300 border-t-pink-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p>Student not found.</p>
        <Link href="/student" className="text-violet-600 underline">
          Back to leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-cyan-50">
      <div className="mx-auto max-w-lg px-6 py-8">
        <Link
          href="/student"
          className="text-sm font-bold text-violet-600 hover:underline"
        >
          ← Leaderboard
        </Link>
        <div className="mt-6 rounded-3xl border-4 border-amber-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto w-fit">
            <StudentAvatar
              studentId={student.id}
              nickName={student.nick_name}
              hasPhoto={student.has_photo}
              size="xl"
            />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-slate-800">
            {student.nick_name}
          </h1>
          <p className="text-slate-500">{student.full_name}</p>
          <p className="mt-2 text-sm text-slate-400">
            {student.subject} · Age {student.age}
          </p>
          <p className="mt-6 font-display text-5xl font-bold text-amber-500 animate-sparkle">
            {total > 0 ? `${total} ⭐` : "No points yet"}
          </p>
          <p className="text-sm text-slate-500">Total star points</p>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold text-slate-800">
          Points by date
        </h2>
        {entries.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-slate-500">
            Keep learning — points will show up here! 💪
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-2xl border-2 border-cyan-100 bg-white px-5 py-4 shadow-sm"
              >
                <div>
                  <p className="font-bold text-slate-800">{e.entry_date}</p>
                  <p className="text-sm text-slate-500">
                    {e.questions_count} Q · {e.points} pts
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <span className="text-2xl">⭐</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
