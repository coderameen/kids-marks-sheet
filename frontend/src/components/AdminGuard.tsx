"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getToken } from "@/lib/api";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/admin/login");
    else setOk(true);
  }, [router]);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-cyan-600" />
      </div>
    );
  }

  return <>{children}</>;
}
