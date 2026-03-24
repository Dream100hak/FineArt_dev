-- Guest article password flow
-- - Adds guest password hash and request IP storage columns
-- - Provides RPC functions for guest create/update/delete

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS guest_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS guest_ip TEXT;

DROP FUNCTION IF EXISTS public.create_guest_article(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_guest_article(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_guest_article(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.create_guest_article(
  p_board_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_writer TEXT,
  p_email TEXT,
  p_category TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  board_id UUID,
  title TEXT,
  content TEXT,
  writer TEXT,
  author TEXT,
  email TEXT,
  category TEXT,
  view_count INTEGER,
  image_url TEXT,
  thumbnail_url TEXT,
  is_pinned BOOLEAN,
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
  v_article_id UUID;
BEGIN
  IF p_board_id IS NULL THEN
    RAISE EXCEPTION 'board_id is required';
  END IF;
  IF coalesce(length(trim(p_title)), 0) = 0 THEN
    RAISE EXCEPTION 'title is required';
  END IF;
  IF coalesce(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'password must be at least 4 characters';
  END IF;

  v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  v_ip_raw := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip', null);
  v_ip := nullif(trim(split_part(coalesce(v_ip_raw, ''), ',', 1)), '');

  INSERT INTO public.articles (
    board_id,
    title,
    content,
    writer,
    author,
    email,
    category,
    is_pinned,
    guest_password_hash,
    guest_ip
  )
  VALUES (
    p_board_id,
    trim(p_title),
    coalesce(p_content, ''),
    coalesce(nullif(trim(p_writer), ''), '익명'),
    coalesce(nullif(trim(p_email), ''), 'guest@fineart.local'),
    nullif(trim(p_email), ''),
    coalesce(nullif(trim(lower(p_category)), ''), 'general'),
    false,
    crypt(trim(p_password), gen_salt('bf')),
    v_ip
  )
  RETURNING public.articles.id INTO v_article_id;

  RETURN QUERY
  SELECT
    a.id,
    a.board_id,
    a.title,
    a.content,
    a.writer,
    a.author,
    a.email,
    a.category,
    a.view_count,
    a.image_url,
    a.thumbnail_url,
    a.is_pinned,
    a.created_at,
    a.updated_at
  FROM public.articles a
  WHERE a.id = v_article_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_guest_article(
  p_article_id UUID,
  p_password TEXT,
  p_title TEXT,
  p_content TEXT,
  p_writer TEXT,
  p_email TEXT,
  p_category TEXT
)
RETURNS TABLE (
  id UUID,
  board_id UUID,
  title TEXT,
  content TEXT,
  writer TEXT,
  author TEXT,
  email TEXT,
  category TEXT,
  view_count INTEGER,
  image_url TEXT,
  thumbnail_url TEXT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_article_id UUID;
BEGIN
  IF p_article_id IS NULL THEN
    RAISE EXCEPTION 'article_id is required';
  END IF;
  IF coalesce(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'password is required';
  END IF;
  IF coalesce(length(trim(p_title)), 0) = 0 THEN
    RAISE EXCEPTION 'title is required';
  END IF;

  UPDATE public.articles AS a
  SET
    title = trim(p_title),
    content = coalesce(p_content, ''),
    writer = coalesce(nullif(trim(p_writer), ''), '익명'),
    author = coalesce(nullif(trim(p_email), ''), 'guest@fineart.local'),
    email = nullif(trim(p_email), ''),
    category = coalesce(nullif(trim(lower(p_category)), ''), 'general'),
    updated_at = now()
  WHERE a.id = p_article_id
    AND a.guest_password_hash IS NOT NULL
    AND crypt(trim(p_password), a.guest_password_hash) = a.guest_password_hash
  RETURNING a.id INTO v_article_id;

  IF v_article_id IS NULL THEN
    RAISE EXCEPTION 'invalid guest password or article';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.board_id,
    a.title,
    a.content,
    a.writer,
    a.author,
    a.email,
    a.category,
    a.view_count,
    a.image_url,
    a.thumbnail_url,
    a.is_pinned,
    a.created_at,
    a.updated_at
  FROM public.articles a
  WHERE a.id = v_article_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_guest_article(
  p_article_id UUID,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_id UUID;
BEGIN
  IF p_article_id IS NULL THEN
    RAISE EXCEPTION 'article_id is required';
  END IF;
  IF coalesce(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'password is required';
  END IF;

  DELETE FROM public.articles AS a
  WHERE a.id = p_article_id
    AND a.guest_password_hash IS NOT NULL
    AND crypt(trim(p_password), a.guest_password_hash) = a.guest_password_hash
  RETURNING a.id INTO v_deleted_id;

  RETURN v_deleted_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_guest_article(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_guest_article(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_guest_article(UUID, TEXT) TO anon, authenticated;
