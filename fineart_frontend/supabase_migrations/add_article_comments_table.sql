-- Article comments (댓글) table + RLS + guest password flow
-- This file adds:
-- - public.article_comments table
-- - RLS policies for public read / authenticated write
-- - RPC functions for guest create/update/delete (password-protected)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- updated_at trigger helper (ensure it exists even if base schema was not applied yet)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure helper functions exist (copied from existing RLS policy setup)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT email FROM public.profiles
    WHERE id = user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  writer TEXT,
  author TEXT,
  email TEXT,
  guest_password_hash TEXT,
  guest_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_article_comments_updated_at ON public.article_comments;
CREATE TRIGGER update_article_comments_updated_at
BEFORE UPDATE ON public.article_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_article_comments_article_id_created_at
  ON public.article_comments(article_id, created_at DESC);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read access for article comments" ON public.article_comments;
CREATE POLICY "Public read access for article comments"
  ON public.article_comments FOR SELECT
  USING (true);

-- Authenticated insert (authenticated users create their own comments)
DROP POLICY IF EXISTS "Authenticated users can create article comments" ON public.article_comments;
CREATE POLICY "Authenticated users can create article comments"
  ON public.article_comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND article_id IS NOT NULL
    AND coalesce(length(trim(content)), 0) > 0
    AND author = public.get_user_email(auth.uid())
  );

-- Authenticated update
DROP POLICY IF EXISTS "Users can update own article comments" ON public.article_comments;
CREATE POLICY "Users can update own article comments"
  ON public.article_comments FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND author = public.get_user_email(auth.uid())
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND author = public.get_user_email(auth.uid())
  );

-- Authenticated delete
DROP POLICY IF EXISTS "Users can delete own article comments" ON public.article_comments;
CREATE POLICY "Users can delete own article comments"
  ON public.article_comments FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND author = public.get_user_email(auth.uid())
  );

-- Admin manage
DROP POLICY IF EXISTS "Admin can manage all article comments" ON public.article_comments;
CREATE POLICY "Admin can manage all article comments"
  ON public.article_comments FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- GUEST PASSWORD FLOW (RPC)
-- ============================================
DROP FUNCTION IF EXISTS public.create_guest_article_comment(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_guest_article_comment(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_guest_article_comment(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.create_guest_article_comment(
  p_article_id UUID,
  p_content TEXT,
  p_writer TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  article_id UUID,
  content TEXT,
  writer TEXT,
  author TEXT,
  email TEXT,
  guest_ip TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_headers JSONB;
  v_ip_raw TEXT;
  v_ip TEXT;
  v_comment_id UUID;
BEGIN
  IF p_article_id IS NULL THEN
    RAISE EXCEPTION 'article_id is required';
  END IF;
  IF coalesce(length(trim(p_content)), 0) = 0 THEN
    RAISE EXCEPTION 'content is required';
  END IF;
  IF coalesce(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'password must be at least 4 characters';
  END IF;

  v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  v_ip_raw := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip', null);
  v_ip := nullif(trim(split_part(coalesce(v_ip_raw, ''), ',', 1)), '');

  INSERT INTO public.article_comments (
    article_id,
    content,
    writer,
    author,
    email,
    guest_password_hash,
    guest_ip
  )
  VALUES (
    p_article_id,
    coalesce(p_content, ''),
    coalesce(nullif(trim(p_writer), ''), '익명'),
    coalesce(nullif(trim(p_email), ''), 'guest@fineart.local'),
    nullif(trim(p_email), ''),
    crypt(trim(p_password), gen_salt('bf')),
    v_ip
  )
  RETURNING public.article_comments.id INTO v_comment_id;

  RETURN QUERY
  SELECT
    c.id,
    c.article_id,
    c.content,
    c.writer,
    c.author,
    c.email,
    c.guest_ip,
    c.created_at,
    c.updated_at
  FROM public.article_comments c
  WHERE c.id = v_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_guest_article_comment(
  p_comment_id UUID,
  p_password TEXT,
  p_content TEXT,
  p_writer TEXT,
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  article_id UUID,
  content TEXT,
  writer TEXT,
  author TEXT,
  email TEXT,
  guest_ip TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  IF p_comment_id IS NULL THEN
    RAISE EXCEPTION 'comment_id is required';
  END IF;
  IF coalesce(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'password is required';
  END IF;
  IF coalesce(length(trim(p_content)), 0) = 0 THEN
    RAISE EXCEPTION 'content is required';
  END IF;

  UPDATE public.article_comments AS c
  SET
    content = coalesce(p_content, ''),
    writer = coalesce(nullif(trim(p_writer), ''), '익명'),
    author = coalesce(nullif(trim(p_email), ''), 'guest@fineart.local'),
    email = nullif(trim(p_email), ''),
    updated_at = now()
  WHERE c.id = p_comment_id
    AND c.guest_password_hash IS NOT NULL
    AND crypt(trim(p_password), c.guest_password_hash) = c.guest_password_hash
  RETURNING c.id INTO v_comment_id;

  IF v_comment_id IS NULL THEN
    RAISE EXCEPTION 'invalid guest password or comment';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.article_id,
    c.content,
    c.writer,
    c.author,
    c.email,
    c.guest_ip,
    c.created_at,
    c.updated_at
  FROM public.article_comments c
  WHERE c.id = v_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_guest_article_comment(
  p_comment_id UUID,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_id UUID;
BEGIN
  IF p_comment_id IS NULL THEN
    RAISE EXCEPTION 'comment_id is required';
  END IF;
  IF coalesce(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'password is required';
  END IF;

  DELETE FROM public.article_comments AS c
  WHERE c.id = p_comment_id
    AND c.guest_password_hash IS NOT NULL
    AND crypt(trim(p_password), c.guest_password_hash) = c.guest_password_hash
  RETURNING c.id INTO v_deleted_id;

  RETURN v_deleted_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_guest_article_comment(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_guest_article_comment(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_guest_article_comment(UUID, TEXT) TO anon, authenticated;

