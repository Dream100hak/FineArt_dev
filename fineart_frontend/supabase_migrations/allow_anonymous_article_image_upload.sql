-- Allow anonymous users to upload board editor images
-- to the `articles` storage bucket.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'articles'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('articles', 'articles', true);
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Public read article images" ON storage.objects;
CREATE POLICY "Public read article images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'articles');

DROP POLICY IF EXISTS "Anon upload article images" ON storage.objects;
CREATE POLICY "Anon upload article images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'articles');

DROP POLICY IF EXISTS "Auth upload article images" ON storage.objects;
CREATE POLICY "Auth upload article images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'articles');
