-- Allow anonymous users to create board articles.
-- Keep update/delete policies unchanged (owner/admin only).

DROP POLICY IF EXISTS "Authenticated users can create articles" ON articles;
DROP POLICY IF EXISTS "Anonymous users can create articles" ON articles;

CREATE POLICY "Anonymous users can create articles"
  ON articles FOR INSERT
  WITH CHECK (
    board_id IS NOT NULL
    AND coalesce(length(trim(title)), 0) > 0
  );
