"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { setToken } from "@/lib/api";

const nav = [
  { href: "/admin/dashboard", label: "Students", icon: "🎒", short: "Students" },
  {
    href: "/admin/dashboard/leaderboard",
    label: "Leaderboard",
    icon: "🏆",
    short: "Board",
  },
];

function navActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return (
      pathname === "/admin/dashboard" ||
      pathname.startsWith("/admin/dashboard/students")
    );
  }
  return pathname === href;
}

export default function AdminShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    setToken(null);
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-sky-50 via-violet-50 to-amber-50 pb-20 md:flex-row md:pb-0">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#1a1f2e] text-white shadow-xl md:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">
            Asra Sara
          </p>
          <h1 className="font-display text-xl font-bold text-white">
            Star Points
          </h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <Link
            href="/student"
            className="mb-3 block rounded-lg bg-white/5 px-3 py-2 text-center text-xs text-cyan-200 hover:bg-white/10"
          >
            👀 Student view
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium hover:bg-white/15"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-violet-100/80 bg-white/90 px-4 py-4 backdrop-blur md:px-8 md:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-cyan-600 md:hidden">
                Asra Sara Admin
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
                {title}
              </h2>
            </div>
            {actions && (
              <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end">
                {actions}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 px-4 py-5 pb-6 md:px-8 md:py-8">{children}</div>
      </div>

      <nav
        className="admin-mobile-nav fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-800/20 bg-[#1a1f2e] px-2 py-2 safe-bottom md:hidden"
        aria-label="Admin navigation"
      >
        {nav.map((item) => {
          const active = navActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-xl px-1 text-xs font-semibold ${
                active ? "bg-cyan-500/25 text-cyan-200" : "text-slate-400"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.short}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className="flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-xl px-1 text-xs font-semibold text-slate-400"
        >
          <span className="text-xl">🚪</span>
          Out
        </button>
      </nav>
    </div>
  );
}
