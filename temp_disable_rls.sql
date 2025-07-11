-- Temporary disable RLS for testing
-- Run this in Supabase SQL Editor to temporarily disable RLS

ALTER TABLE organisations DISABLE ROW LEVEL SECURITY;

-- After testing, you can re-enable it with:
-- ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;