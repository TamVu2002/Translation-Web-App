-- =====================================================
-- Storage Buckets & Policies
-- Run this in Supabase SQL Editor AFTER creating buckets
-- =====================================================

-- First, create buckets manually in Supabase Dashboard:
-- 1. Go to Storage > Create new bucket
-- 2. Create "media" bucket (private)
-- 3. Create "subtitles" bucket (private)

-- =====================================================
-- Storage Policies for "media" bucket
-- =====================================================

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own media
CREATE POLICY "Users can read own media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own media
CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Storage Policies for "subtitles" bucket
-- =====================================================

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own subtitles"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'subtitles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own subtitles
CREATE POLICY "Users can read own subtitles"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'subtitles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own subtitles
CREATE POLICY "Users can update own subtitles"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'subtitles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own subtitles
CREATE POLICY "Users can delete own subtitles"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'subtitles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
