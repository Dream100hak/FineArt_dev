-- articles.thumbnail_url is now optional: editor no longer uploads thumbnail.
-- When thumbnail_url is NULL, the frontend uses the first <img> in content for list/gallery display.
-- Run in Supabase Dashboard > SQL Editor if you want to document the column.

COMMENT ON COLUMN articles.thumbnail_url IS 'Optional. When NULL, list/gallery uses first image in content. Editor no longer uploads thumbnail.';
