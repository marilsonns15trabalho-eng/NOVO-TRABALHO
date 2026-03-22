-- SQL Script to set up Supabase Storage for LIONESS FIT App

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('fitness-assets', 'fitness-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS for storage.objects (it's usually enabled by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the 'fitness-assets' bucket

-- Allow public access to read files (SELECT)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fitness-assets');

-- Allow authenticated users to upload files (INSERT)
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'fitness-assets' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their own files (UPDATE)
CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'fitness-assets' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files (DELETE)
CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'fitness-assets' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
