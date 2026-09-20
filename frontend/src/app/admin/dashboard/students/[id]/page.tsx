"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PointsFormModal from "@/components/PointsFormModal";
import StudentFormModal from "@/components/StudentFormModal";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { PointEntry, Student } from "@/types";

export default function AdminStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [student, setStudent] = useState<Student | null>(null);
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addPointsOpen, setAddPointsOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PointEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);

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

  async function handleDelete() {
    if (!student) return;
    const ok = window.confirm(
      `Delete ${student.nick_name}? This removes their points and cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.deleteStudent(student.id);
      router.push("/admin/dashboard");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete student");
      setDeleting(false);
    }
  }

  async function handleDeleteEntry(entry: PointEntry) {
    const ok = window.confirm(
      `Delete ${entry.points} point${entry.points !== 1 ? "s" : ""} from ${entry.entry_date}? This cannot be undone.`
    );
    if (!ok) return;
    setDeletingEntryId(entry.id);
    try {
      await api.deletePoints(id, entry.id);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete points");
    } finally {
      setDeletingEntryId(null);
    }
  }

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
              onClick={handleDelete}
              disabled={deleting}
              className="min-h-[44px] rounded-xl border-2 border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
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

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-1">
            <div className="flex gap-4 sm:gap-5">
              <div className="shrink-0">
                <StudentAvatar
                  studentId={student.id}
                  nickName={student.nick_name}
                  hasPhoto={student.has_photo}
                  size="xl"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      {student.full_name}
                    </h2>
                    {student.nick_name !== student.full_name && (
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {student.nick_name}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-center ring-1 ring-slate-100">
                    <p className="text-2xl font-semibold tabular-nums text-slate-900">
                      {total}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Stars
                    </p>
                  </div>
                </div>

                <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500">Age</dt>
                    <dd className="font-medium text-slate-800">{student.age}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">Exam</dt>
                    <dd className="truncate text-right font-medium text-slate-800">
                      {student.subject}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
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
                        {e.note ? ` · ${e.note}` : ""}
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
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(e)}
                        disabled={deletingEntryId === e.id}
                        className="min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50"
                      >
                        {deletingEntryId === e.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setAddPointsOpen(true)}
              className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-base font-bold text-white shadow-lg"
            >
              ⭐ Add point
            </button>
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
