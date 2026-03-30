export interface ExerciseLibraryItem {
  id: string;
  display_name: string;
  original_name: string;
  primary_muscle: string | null;
  primary_muscle_label: string | null;
  category: string | null;
  category_label: string | null;
  difficulty: string | null;
  instructions: string[];
  has_official_video: boolean;
  stream_path: string | null;
  preview_image_url: string | null;
  gallery_image_urls: string[];
  license_name: string | null;
  license_url: string | null;
  license_author: string | null;
}

export interface ExerciseLibrarySearchResponse {
  results: ExerciseLibraryItem[];
  source: 'wger';
  powered_by: 'wger';
  searched_queries: string[];
}
