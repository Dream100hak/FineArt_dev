-- Add reply support (parent_comment_id) + guest reply RPC signature updates.

-- ============================================
-- TABLE ALTER
-- ============================================
ALTER TABLE public.article_comments
ADD COLUMN IF NOT EXISTS parent_comment_id UUID
REFERENCES public.article_comments(id) ON DELETE CASCADE;

-- ============================================
-- RLS: allow replies by validating parent belongs to same article
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create article comments" ON public.article_comments;

CREATE POLICY "Authenticated users can create article comments"
  ON public.article_comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND article_id IS NOT NULL
    AND coalesce(length(trim(content)), 0) > 0
    AND author = public.get_user_email(auth.uid())
    AND (
      parent_comment_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.article_comments pc
        WHERE pc.id = parent_comment_id
          AND pc.article_id = article_id
      )
    )
  );

-- ============================================
-- GUEST RPC: create_guest_article_comment (signature change)
-- ============================================
DROP FUNCTION IF EXISTS public.create_guest_article_comment(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_guest_article_comment(UUID, UUID, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_guest_article_comment(
  p_article_id UUID,
  p_parent_comment_id UUID,
  p_content TEXT,
  p_writer TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  article_id UUID,
  parent_comment_id UUID,
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

  IF p_parent_comment_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.article_comments pc
      WHERE pc.id = p_parent_comment_id
        AND pc.article_id = p_article_id
    ) THEN
      RAISE EXCEPTION 'invalid parent_comment_id';
    END IF;
  END IF;

  v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  v_ip_raw := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip', null);
  v_ip := nullif(trim(split_part(coalesce(v_ip_raw, ''), ',', 1)), '');

  INSERT INTO public.article_comments (
    article_id,
    parent_comment_id,
    content,
    writer,
    author,
    email,
    guest_password_hash,
    guest_ip
  )
  VALUES (
    p_article_id,
    p_parent_comment_id,
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
    c.parent_comment_id,
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

-- ============================================
-- GUEST RPC: update_guest_article_comment (include parent_comment_id in return)
-- ============================================
DROP FUNCTION IF EXISTS public.update_guest_article_comment(UUID, TEXT, TEXT, TEXT, TEXT);

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
  parent_comment_id UUID,
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
    AND crypt(trim(p_password), c.guest_password_hash) = c.guest_password_hash;

  -- If update didn't match, return an error like existing behavior
  SELECT c.id INTO v_comment_id
  FROM public.article_comments c
  WHERE c.id = p_comment_id;

  IF v_comment_id IS NULL THEN
    RAISE EXCEPTION 'invalid guest password or comment';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.article_id,
    c.parent_comment_id,
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

-- ============================================
-- Grants for new guest create signature
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_guest_article_comment(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

