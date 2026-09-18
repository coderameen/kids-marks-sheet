"use client";

import { useRef, useState } from "react";
import StudentAvatar from "@/components/StudentAvatar";
import { api } from "@/lib/api";
import type { Student } from "@/types";

export default function ProfilePhotoEditor({
  student,
  onUpdated,
}: {
  student: Student;
  onUpdated: (s: Student) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [cacheKey, setCacheKey] = useState(Date.now());
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.uploadStudentPhoto(student.id, file);
      onUpdated(res.student);
      setCacheKey(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onDelete() {
    if (!student.has_photo) return;
    if (!confirm("Remove this profile picture?")) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.deleteStudentPhoto(student.id);
      onUpdated(res.student);
      setCacheKey(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 sm:p-5">
      <p className="text-sm font-semibold text-slate-700">Profile picture</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <StudentAvatar
          studentId={student.id}
          nickName={student.nick_name}
          hasPhoto={student.has_photo}
          size="xl"
          cacheKey={cacheKey}
        />
        <div className="flex w-full flex-col gap-2 sm:flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="min-h-[48px] rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Please wait…" : "📷 Change photo"}
          </button>
          {student.has_photo && (
            <button
              type="button"
              disabled={busy}
              onClick={onDelete}
              className="min-h-[48px] rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60"
            >
              Remove photo
            </button>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
