import { authorizedApiJson } from '@/lib/api-client';
import type { ExerciseLibrarySearchResponse } from '@/types/exercise-library';

export async function searchOfficialExerciseLibrary(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], source: 'wger', powered_by: 'wger', searched_queries: [] } satisfies ExerciseLibrarySearchResponse;
  }

  return authorizedApiJson<ExerciseLibrarySearchResponse>(
    `/api/exercise-library/search?q=${encodeURIComponent(trimmed)}`,
    { method: 'GET' },
  );
}
