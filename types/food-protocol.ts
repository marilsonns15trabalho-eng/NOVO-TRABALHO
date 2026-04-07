export interface FoodProtocolStudent {
  id: string;
  nome: string;
  email?: string | null;
  linked_auth_user_id?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

export interface FoodProtocol {
  id: string;
  student_id: string;
  title: string;
  storage_path: string;
  file_name?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  uploaded_by_auth_user_id?: string | null;
  signed_url?: string | null;
  students?: FoodProtocolStudent;
}

export interface FoodProtocolUploadInput {
  student_id: string;
  title?: string;
  file: File;
}
