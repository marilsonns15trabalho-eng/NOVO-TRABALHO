export type UserRole = "admin" | "personal" | "student";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  plan_name?: string;
  status?: string;
}

export interface Assessment {
  id: string;
  student_id: string;
  weight?: number;
  height?: number;
  results?: {
    bmi?: number;
    fatPercentage?: number;
  };
}