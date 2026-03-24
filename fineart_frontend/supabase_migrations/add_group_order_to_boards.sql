-- Add group-order control for board grouping UI.

ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS group_order INTEGER NOT NULL DEFAULT 0;

UPDATE public.boards
SET group_order = CASE
  WHEN group_name = '게임 정보' THEN 10
  WHEN group_name = '커뮤니티' THEN 20
  ELSE coalesce(group_order, 30)
END;
