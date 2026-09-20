import { apiBase } from "@/lib/apiBase";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("admin_token", token);
  else localStorage.removeItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Could not reach the server. Wait a moment and try again (live API may be waking up)."
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText || "Request failed");
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getStudents: () =>
    request<{ students: import("@/types").Student[] }>("/api/students"),

  createStudent: (data: {
    full_name: string;
    nick_name: string;
    age: number;
    subject: string;
  }) =>
    request<{ student: import("@/types").Student }>("/api/students", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateStudent: (
    id: number,
    data: {
      full_name: string;
      nick_name: string;
      age: number;
      subject: string;
    }
  ) =>
    request<{ student: import("@/types").Student }>(`/api/students/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: number) =>
    request<{ ok: boolean }>(`/api/students/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  getStudent: (id: number) =>
    request<{
      student: import("@/types").Student;
      entries: import("@/types").PointEntry[];
      total_points: number;
    }>(`/api/students/${id}`),

  addPoints: (
    id: number,
    data: { points: number; questions_count: number; entry_date: string; note?: string }
  ) =>
    request<{ entry: import("@/types").PointEntry; total_points: number }>(
      `/api/students/${id}/points`,
      {
        method: "POST",
        auth: true,
        body: JSON.stringify(data),
      }
    ),

  updatePoints: (
    studentId: number,
    entryId: number,
    data: { points: number; questions_count: number; entry_date: string; note?: string }
  ) =>
    request<{ entry: import("@/types").PointEntry; total_points: number }>(
      `/api/students/${studentId}/points/${entryId}`,
      {
        method: "PUT",
        auth: true,
        body: JSON.stringify(data),
      }
    ),

  deletePoints: (studentId: number, entryId: number) =>
    request<{ ok: boolean; total_points: number }>(
      `/api/students/${studentId}/points/${entryId}`,
      { method: "DELETE", auth: true }
    ),

  getLeaderboard: () =>
    request<{ leaderboard: import("@/types").LeaderboardEntry[] }>(
      "/api/leaderboard"
    ),

  uploadStudentPhoto: async (studentId: number, file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append("photo", file);
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/api/students/${studentId}/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    } catch {
      throw new Error("Could not reach the server.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Upload failed");
    }
    return res.json() as Promise<{ student: import("@/types").Student }>;
  },

  deleteStudentPhoto: (studentId: number) =>
    request<{ student: import("@/types").Student }>(
      `/api/students/${studentId}/photo`,
      { method: "DELETE", auth: true }
    ),

  getMarksReport: (period: "weekly" | "monthly" | "yearly") =>
    request<import("@/types").MarksReport>(
      `/api/reports/marks?period=${period}`
    ),
};
