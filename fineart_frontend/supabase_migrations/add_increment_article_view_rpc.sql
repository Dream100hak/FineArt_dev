-- Increment article view count via RPC (RLS-safe).

CREATE OR REPLACE FUNCTION public.increment_article_view(p_article_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_view_count INTEGER;
BEGIN
  IF p_article_id IS NULL THEN
    RAISE EXCEPTION 'article_id is required';
  END IF;

  UPDATE public.articles AS a
  SET
    view_count = coalesce(a.view_count, 0) + 1
  WHERE a.id = p_article_id
  RETURNING a.view_count INTO v_view_count;

  RETURN coalesce(v_view_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_view(UUID) TO anon, authenticated;
