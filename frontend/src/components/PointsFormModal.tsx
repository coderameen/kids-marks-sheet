"use client";

import { FormEvent, useEffect, useState } from "react";
import type { PointEntry } from "@/types";

export default function PointsFormModal({
  open,
  onClose,
  onSubmit,
  mode = "add",
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    points: number;
    questions_count: number;
    entry_date: string;
  }) => Promise<void>;
  mode?: "add" | "edit";
  initial?: PointEntry | null;
}) {
  const [points, setPoints] = useState("");
  const [questions, setQuestions] = useState("1");
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setPoints(String(initial.points));
      setQuestions(String(initial.questions_count));
      setEntryDate(initial.entry_date.slice(0, 10));
    } else {
      setPoints("");
      setQuestions("1");
      setEntryDate(new Date().toISOString().slice(0, 10));
    }
    setError("");
  }, [open, mode, initial]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const p = parseInt(points, 10);
    const q = parseInt(questions, 10);
    if (Number.isNaN(p) || p < 0) {
      setError("Enter points as a number (0 if all wrong).");
      return;
    }
    if (Number.isNaN(q) || q < 1) {
      setError("Questions must be at least 1.");
      return;
    }
    if (!entryDate) {
      setError("Date is required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        points: p,
        questions_count: q,
        entry_date: entryDate,
      });
      if (mode === "add") {
        setPoints("");
        setQuestions("1");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-4 border-cyan-300 bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <h3 className="font-display text-xl font-bold text-slate-800 sm:text-2xl">
          {mode === "edit" ? "✏️ Edit points" : "⭐ Add points"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Wrong answers = 0 points. One question can be 1 point.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Date</span>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-base focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              How many questions?
            </span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-base focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Points earned (numbers only)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              required
              placeholder="e.g. 3"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-violet-100 px-4 py-3 text-lg font-bold focus:border-cyan-400 focus:outline-none"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-200 py-3 font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 font-bold text-white shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "edit" ? "Update" : "Save points"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
