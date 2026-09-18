"use client";

import { useState } from "react";
import MarksReportModal from "@/components/MarksReportModal";

const periods = [
  { id: "weekly" as const, label: "Weekly" },
  { id: "monthly" as const, label: "Monthly" },
  { id: "yearly" as const, label: "Yearly" },
];

export default function ViewReportButtons() {
  const [activePeriod, setActivePeriod] = useState<
    "weekly" | "monthly" | "yearly" | null
  >(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePeriod(p.id)}
            className="min-h-[44px] rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700 sm:px-4 sm:text-sm"
          >
            📊 View {p.label}
          </button>
        ))}
      </div>
      <MarksReportModal
        period={activePeriod}
        open={activePeriod !== null}
        onClose={() => setActivePeriod(null)}
      />
    </>
  );
}
