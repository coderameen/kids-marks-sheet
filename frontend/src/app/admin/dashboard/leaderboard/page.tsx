"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import LeaderboardPanel from "@/components/LeaderboardPanel";

export default function AdminLeaderboardPage() {
  return (
    <AdminGuard>
      <AdminShell title="Leaderboard">
        <LeaderboardPanel />
      </AdminShell>
    </AdminGuard>
  );
}
