export type Student = {
  id: number;
  full_name: string;
  nick_name: string;
  age: number;
  subject: string;
  created_at: string;
  profile_photo?: string | null;
  has_photo?: boolean;
  total_points?: number;
  entry_count?: number;
};

export type PointEntry = {
  id: number;
  student_id: number;
  points: number;
  questions_count: number;
  entry_date: string;
  note: string | null;
  created_at: string;
};

export type MarksReportEntry = {
  student_id: number;
  full_name: string;
  nick_name: string;
  age: number;
  subject: string;
  entry_date: string;
  questions_count: number;
  points: number;
  note: string;
};

export type MarksReport = {
  period: "weekly" | "monthly" | "yearly";
  from_date: string;
  to_date: string;
  entries: MarksReportEntry[];
  entry_count: number;
  total_points: number;
};

export type LeaderboardEntry = {
  rank: number;
  id: number;
  full_name: string;
  nick_name: string;
  age: number;
  subject: string;
  has_photo?: boolean;
  total_points: number;
  sessions_count: number;
};
