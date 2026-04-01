import { authorizedApiJson } from '@/lib/api-client';

type LegacyImportResponse = {
  dry_run: boolean;
  default_password: string;
  total_candidates: number;
  created_auth_users: number;
  reused_auth_users: number;
  created_students: number;
  updated_students: number;
  skipped_role_conflicts: Array<{ email: string; role: string }>;
  imported: Array<{ legacy_lpe_id: number; email: string; name: string }>;
};

export async function importLegacyLpeStudents(dryRun = false) {
  return authorizedApiJson<LegacyImportResponse>('/api/admin/import-legacy-lpe-students', {
    method: 'POST',
    body: JSON.stringify({ dryRun }),
  });
}

type LegacyRefreshImportResponse = {
  dry_run: boolean;
  default_password: string;
  total_student_candidates: number;
  total_avaliacao_candidates: number;
  created_auth_users: number;
  reused_auth_users: number;
  created_students: number;
  updated_students: number;
  created_avaliacoes: number;
  updated_avaliacoes: number;
  skipped_role_conflicts: Array<{ email: string; role: string }>;
  skipped_avaliacoes_missing_student: Array<{
    legacy_lpe_id: number;
    legacy_lpe_student_id: number;
    student_email: string | null;
  }>;
  imported_students: Array<{ legacy_lpe_id: number; email: string; name: string }>;
  imported_avaliacoes: Array<{
    legacy_lpe_id: number;
    legacy_lpe_student_id: number;
    student_email: string | null;
    data: string;
  }>;
};

export async function importLegacyLpeRefresh(dryRun = false) {
  return authorizedApiJson<LegacyRefreshImportResponse>('/api/admin/import-legacy-lpe-refresh', {
    method: 'POST',
    body: JSON.stringify({ dryRun }),
  });
}
