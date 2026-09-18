"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Student } from "@/types";

type FormData = {
  full_name: string;
  nick_name: string;
  age: number;
  subject: string;
};

export default function StudentFormModal({
  open,
  onClose,
  onSubmit,
  mode = "add",
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  mode?: "add" | "edit";
  initial?: Student | null;
}) {
  const [fullName, setFullName] = useState("");
  const [nickName, setNickName] = useState("");
  const [age, setAge] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setFullName(initial.full_name);
      setNickName(initial.nick_name);
      setAge(String(initial.age));
      setSubject(initial.subject);
    } else {
      setFullName("");
      setNickName("");
      setAge("");
      setSubject("");
    }
    setError("");
  }, [open, mode, initial]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const ageNum = parseInt(age, 10);
    if (!fullName.trim() || !nickName.trim() || !subject.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (Number.isNaN(ageNum)) {
      setError("Age must be a number.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        nick_name: nickName.trim(),
        age: ageNum,
        subject: subject.trim(),
      });
      if (mode === "add") {
        setFullName("");
        setNickName("");
        setAge("");
        setSubject("");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-4 border-violet-300 bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <h3 className="font-display text-xl font-bold text-slate-800 sm:text-2xl">
          {mode === "edit" ? "✏️ Edit student" : "🎉 Add a new student"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-base focus:border-violet-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Nick name</span>
            <input
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-base focus:border-violet-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Age</span>
            <input
              type="number"
              min={3}
              max={25}
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-base focus:border-violet-400 focus:outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Subject enrolled</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quran, Math, English"
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-base focus:border-violet-400 focus:outline-none"
            />
          </label>
          {error && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-200 py-3 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] flex-1 rounded-xl bg-cyan-500 py-3 font-bold text-white shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Add student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
