-- Replace parent-board nesting with group tag classification.

ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Optional seed for common groups used in existing board slugs.
UPDATE public.boards
SET group_name = CASE
  WHEN slug IN ('notice', 'timeline') THEN '게임 정보'
  WHEN slug IN ('free', 'qna', 'tips') THEN '커뮤니티'
  ELSE coalesce(group_name, '기타')
END
WHERE group_name IS NULL OR trim(group_name) = '';
