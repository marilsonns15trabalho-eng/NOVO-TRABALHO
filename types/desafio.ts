export type ChallengeStatus = 'draft' | 'active' | 'archived';

export interface ChallengeStudent {
  id: string;
  nome: string;
  email?: string | null;
  linked_auth_user_id?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

export interface ChallengeSummary {
  id: string;
  title: string;
  description?: string | null;
  status: ChallengeStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  created_by_auth_user_id?: string | null;
  updated_by_auth_user_id?: string | null;
  participant_count?: number;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  student_id: string;
  assigned_at: string;
  removed_at?: string | null;
  notes?: string | null;
  students?: ChallengeStudent;
}

export interface ChallengeDay {
  id: string;
  challenge_id: string;
  challenge_date: string;
  title?: string | null;
  training_guidance?: string | null;
  nutrition_guidance?: string | null;
  notes?: string | null;
  linked_training_plan_id?: string | null;
  linked_food_protocol_id?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  signed_url?: string | null;
  updated_by_auth_user_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ChallengeUpsertInput {
  title: string;
  description?: string | null;
  status: ChallengeStatus;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ChallengeDayUpsertInput {
  challenge_id: string;
  challenge_date: string;
  title?: string | null;
  training_guidance?: string | null;
  nutrition_guidance?: string | null;
  notes?: string | null;
  linked_training_plan_id?: string | null;
  linked_food_protocol_id?: string | null;
  file?: File | null;
}

export interface StudentChallengeHub {
  student_id: string | null;
  active_challenges: ChallengeSummary[];
  today_entries: ChallengeDay[];
  has_visible_challenges: boolean;
}
