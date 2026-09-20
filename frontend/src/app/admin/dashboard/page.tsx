"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StudentFormModal from "@/components/StudentFormModal";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import ViewReportButtons from "@/components/ViewReportButtons";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { Student } from "@/types";

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getStudents()
      .then((r) => setStudents(r.students))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditStudent(null);
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditStudent(s);
    setModalOpen(true);
  }

  async function handleDelete(s: Student) {
    const ok = window.confirm(
      `Delete ${s.nick_name}? This removes their points and cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(s.id);
    try {
      await api.deleteStudent(s.id);
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete student");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminGuard>
      <AdminShell
        title="Students"
        actions={
          <>
            <ViewReportButtons />
            <button
              type="button"
              onClick={openAdd}
              className="min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg sm:px-5"
            >
              + Add students
            </button>
          </>
        }
      >
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-violet-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-violet-200 bg-white p-8 text-center shadow-sm sm:p-16">
            <p className="text-6xl">🌳</p>
            <h3 className="mt-4 font-display text-xl font-bold text-slate-800 sm:text-2xl">
              No students at this time
            </h3>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Tap &quot;Add students&quot; to register full name, nick name, age,
              and subject.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-6 min-h-[48px] rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white"
            >
              Add your first student
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {students.map((s) => (
                <article
                  key={s.id}
                  className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <StudentAvatar
                      studentId={s.id}
                      nickName={s.nick_name}
                      hasPhoto={s.has_photo}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold text-slate-800">
                        {s.nick_name}
                      </p>
                      <p className="text-sm text-slate-500">{s.full_name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Age {s.age} · {s.subject}
                      </p>
                    </div>
                    <div className="text-right">
                      {(s.total_points ?? 0) > 0 ? (
                        <span className="font-display text-xl font-bold text-violet-600">
                          {s.total_points} ⭐
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No points yet</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/dashboard/students/${s.id}`}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-violet-100 font-semibold text-violet-700"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="min-h-[44px] rounded-xl border-2 border-slate-200 px-4 font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      className="min-h-[44px] rounded-xl border-2 border-rose-200 px-4 font-semibold text-rose-600 disabled:opacity-50"
                    >
                      {deletingId === s.id ? "…" : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-violet-100 bg-white shadow-sm md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-violet-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Age</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Total points</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-cyan-50/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          studentId={s.id}
                          nickName={s.nick_name}
                          hasPhoto={s.has_photo}
                          size="sm"
                        />
                        <div>
                          <p className="font-display font-bold text-slate-800">
                            {s.nick_name}
                          </p>
                          <p className="text-slate-500">{s.full_name}</p>
                        </div>
                      </div>
                    </td>
                      <td className="px-6 py-4">{s.age}</td>
                      <td className="px-6 py-4">{s.subject}</td>
                      <td className="px-6 py-4">
                        {(s.total_points ?? 0) > 0 ? (
                          <span className="font-display text-lg font-bold text-violet-600">
                            {s.total_points} ⭐
                          </span>
                        ) : (
                          <span className="text-slate-400">No points yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            disabled={deletingId === s.id}
                            className="rounded-lg border border-rose-200 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === s.id ? "…" : "Delete"}
                          </button>
                          <Link
                            href={`/admin/dashboard/students/${s.id}`}
                            className="rounded-lg bg-violet-100 px-4 py-2 font-semibold text-violet-700 hover:bg-violet-200"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <StudentFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={editStudent ? "edit" : "add"}
          initial={editStudent}
          onSubmit={async (data) => {
            if (editStudent) {
              await api.updateStudent(editStudent.id, data);
            } else {
              await api.createStudent(data);
            }
            load();
          }}
        />
      </AdminShell>
    </AdminGuard>
  );
}
