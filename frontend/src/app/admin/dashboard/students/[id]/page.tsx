"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PointsFormModal from "@/components/PointsFormModal";
import StudentFormModal from "@/components/StudentFormModal";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import ProfilePhotoEditor from "@/components/ProfilePhotoEditor";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { PointEntry, Student } from "@/types";

export default function AdminStudentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [student, setStudent] = useState<Student | null>(null);
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addPointsOpen, setAddPointsOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PointEntry | null>(null);

  const load = useCallback(() => {
    if (Number.isNaN(id)) return;
    setLoading(true);
    api
      .getStudent(id)
      .then((r) => {
        setStudent(r.student);
        setEntries(r.entries);
        setTotal(r.total_points);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !student) {
    return (
      <AdminGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-violet-600" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminShell
        title={student.nick_name}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditStudentOpen(true)}
              className="min-h-[44px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            >
              ✏️ Edit info
            </button>
            <button
              type="button"
              onClick={() => setAddPointsOpen(true)}
              className="min-h-[44px] rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
            >
              ⭐ Add point
            </button>
          </div>
        }
      >
        <Link
          href="/admin/dashboard"
          className="mb-6 inline-block text-sm font-semibold text-cyan-600 hover:underline"
        >
          ← All students
        </Link>

        <ProfilePhotoEditor
          student={student}
          onUpdated={(s) => {
            setStudent(s);
            load();
          }}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 p-6 text-white shadow-xl lg:col-span-1">
            <div className="mb-4 flex justify-center sm:justify-start">
              <StudentAvatar
                studentId={student.id}
                nickName={student.nick_name}
                hasPhoto={student.has_photo}
                size="xl"
              />
            </div>
            <p className="text-white/80">{student.full_name}</p>
            <p className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              {total > 0 ? `${total} ⭐` : "No points yet"}
            </p>
            <p className="mt-4 text-sm">
              Age {student.age} · {student.subject}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
            <h3 className="font-display text-xl font-bold text-slate-800">
              Points history
            </h3>
            {entries.length === 0 ? (
              <p className="mt-6 text-slate-500">
                No points yet. Use &quot;Add point&quot; to record scores with
                the date.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-violet-50">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">
                        📅 {e.entry_date}
                      </p>
                      <p className="text-sm text-slate-500">
                        {e.questions_count} question
                        {e.questions_count !== 1 ? "s" : ""} · {e.points} point
                        {e.points !== 1 ? "s" : ""} earned
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl font-bold text-violet-600">
                        +{e.points}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditEntry(e)}
                        className="min-h-[44px] rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <PointsFormModal
          open={addPointsOpen}
          onClose={() => setAddPointsOpen(false)}
          mode="add"
          onSubmit={async (data) => {
            await api.addPoints(id, data);
            load();
          }}
        />

        <PointsFormModal
          open={!!editEntry}
          onClose={() => setEditEntry(null)}
          mode="edit"
          initial={editEntry}
          onSubmit={async (data) => {
            if (!editEntry) return;
            await api.updatePoints(id, editEntry.id, data);
            load();
          }}
        />

        <StudentFormModal
          open={editStudentOpen}
          onClose={() => setEditStudentOpen(false)}
          mode="edit"
          initial={student}
          onSubmit={async (data) => {
            const res = await api.updateStudent(id, data);
            setStudent(res.student);
            load();
          }}
        />
      </AdminShell>
    </AdminGuard>
  );
}
