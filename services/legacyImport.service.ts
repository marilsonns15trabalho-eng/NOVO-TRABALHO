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
