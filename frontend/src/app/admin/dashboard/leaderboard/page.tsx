"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import LeaderboardPanel from "@/components/LeaderboardPanel";

export default function AdminLeaderboardPage() {
  return (
    <AdminGuard>
      <AdminShell title="Leaderboard">
        <p className="mb-6 text-slate-600">
          Who is leading the star race? Tap a student to see their points by
          date.
        </p>
        <LeaderboardPanel
          studentBasePath="/admin/dashboard/students"
          showLinks
        />
      </AdminShell>
    </AdminGuard>
  );
}
