-- Board tag management table for drag-and-drop ordering.

CREATE TABLE IF NOT EXISTS public.board_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_tags_order_index ON public.board_tags(order_index);

DROP TRIGGER IF EXISTS update_board_tags_updated_at ON public.board_tags;
CREATE TRIGGER update_board_tags_updated_at
BEFORE UPDATE ON public.board_tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.board_tags (name, order_index)
SELECT DISTINCT
  coalesce(nullif(trim(group_name), ''), '기타') AS name,
  coalesce(min(group_order), 0) AS order_index
FROM public.boards
GROUP BY coalesce(nullif(trim(group_name), ''), '기타')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.board_tags (name, order_index)
VALUES ('기타', 999)
ON CONFLICT (name) DO NOTHING;
