-- Add thumbnail_url, image_url, is_pinned, email to articles (게시판 대표이미지/공지 고정용)
-- thumbnail_url: optional. When NULL, frontend uses first image in content for list/gallery.
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
