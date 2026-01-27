-- Supabase Storage RLS Policies for FineArt
-- Storage 버킷에 대한 접근 권한 설정

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- 버킷이 존재하지 않으면 생성 (SQL로는 불가능, Dashboard에서 수동 생성 필요)
-- 다음 버킷들을 Supabase Dashboard에서 생성해야 합니다:
-- - articles (Public)
-- - artworks (Public)
-- - exhibitions (Public)
-- - avatars (Public)

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Storage RLS는 storage.objects 테이블에 대해 설정됩니다.

-- ============================================
-- ARTICLES BUCKET POLICIES
-- ============================================

-- Public read access for articles bucket
DROP POLICY IF EXISTS "Public read access for articles bucket" ON storage.objects;
CREATE POLICY "Public read access for articles bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'articles');

-- Authenticated users can upload to articles bucket
DROP POLICY IF EXISTS "Authenticated users can upload to articles" ON storage.objects;
CREATE POLICY "Authenticated users can upload to articles"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'articles' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own files in articles bucket
DROP POLICY IF EXISTS "Users can update own files in articles" ON storage.objects;
CREATE POLICY "Users can update own files in articles"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'articles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'articles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files in articles bucket
DROP POLICY IF EXISTS "Users can delete own files in articles" ON storage.objects;
CREATE POLICY "Users can delete own files in articles"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'articles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin can manage all files in articles bucket
DROP POLICY IF EXISTS "Admin can manage all files in articles" ON storage.objects;
CREATE POLICY "Admin can manage all files in articles"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'articles' AND
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'articles' AND
    public.is_admin(auth.uid())
  );

-- ============================================
-- ARTWORKS BUCKET POLICIES
-- ============================================

-- Public read access for artworks bucket
DROP POLICY IF EXISTS "Public read access for artworks bucket" ON storage.objects;
CREATE POLICY "Public read access for artworks bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artworks');

-- Authenticated users can upload to artworks bucket
DROP POLICY IF EXISTS "Authenticated users can upload to artworks" ON storage.objects;
CREATE POLICY "Authenticated users can upload to artworks"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artworks' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own files in artworks bucket
DROP POLICY IF EXISTS "Users can update own files in artworks" ON storage.objects;
CREATE POLICY "Users can update own files in artworks"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'artworks' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'artworks' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files in artworks bucket
DROP POLICY IF EXISTS "Users can delete own files in artworks" ON storage.objects;
CREATE POLICY "Users can delete own files in artworks"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artworks' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin can manage all files in artworks bucket
DROP POLICY IF EXISTS "Admin can manage all files in artworks" ON storage.objects;
CREATE POLICY "Admin can manage all files in artworks"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'artworks' AND
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'artworks' AND
    public.is_admin(auth.uid())
  );

-- ============================================
-- EXHIBITIONS BUCKET POLICIES
-- ============================================

-- Public read access for exhibitions bucket
DROP POLICY IF EXISTS "Public read access for exhibitions bucket" ON storage.objects;
CREATE POLICY "Public read access for exhibitions bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exhibitions');

-- Authenticated users can upload to exhibitions bucket
DROP POLICY IF EXISTS "Authenticated users can upload to exhibitions" ON storage.objects;
CREATE POLICY "Authenticated users can upload to exhibitions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exhibitions' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own files in exhibitions bucket
DROP POLICY IF EXISTS "Users can update own files in exhibitions" ON storage.objects;
CREATE POLICY "Users can update own files in exhibitions"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exhibitions' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'exhibitions' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files in exhibitions bucket
DROP POLICY IF EXISTS "Users can delete own files in exhibitions" ON storage.objects;
CREATE POLICY "Users can delete own files in exhibitions"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exhibitions' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin can manage all files in exhibitions bucket
DROP POLICY IF EXISTS "Admin can manage all files in exhibitions" ON storage.objects;
CREATE POLICY "Admin can manage all files in exhibitions"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'exhibitions' AND
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'exhibitions' AND
    public.is_admin(auth.uid())
  );

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================

-- Public read access for avatars bucket
DROP POLICY IF EXISTS "Public read access for avatars bucket" ON storage.objects;
CREATE POLICY "Public read access for avatars bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload to avatars bucket
DROP POLICY IF EXISTS "Authenticated users can upload to avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload to avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own files in avatars bucket
DROP POLICY IF EXISTS "Users can update own files in avatars" ON storage.objects;
CREATE POLICY "Users can update own files in avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files in avatars bucket
DROP POLICY IF EXISTS "Users can delete own files in avatars" ON storage.objects;
CREATE POLICY "Users can delete own files in avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin can manage all files in avatars bucket
DROP POLICY IF EXISTS "Admin can manage all files in avatars" ON storage.objects;
CREATE POLICY "Admin can manage all files in avatars"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars' AND
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    public.is_admin(auth.uid())
  );
