-- Row Level Security (RLS) Policies for FineArt (Fixed - No Recursion)
-- Enable RLS and create policies for all tables

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================
-- This function uses SECURITY DEFINER to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Get user email from profiles
-- ============================================
-- This function uses SECURITY DEFINER to avoid RLS restrictions
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT email FROM public.profiles
    WHERE id = user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (using function to avoid recursion)
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================
-- ARTISTS POLICIES
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for artists" ON artists;
DROP POLICY IF EXISTS "Admin only for artists" ON artists;

-- Public read access
CREATE POLICY "Public read access for artists"
  ON artists FOR SELECT
  USING (true);

-- Admin only write access (using function to avoid recursion)
CREATE POLICY "Admin only for artists"
  ON artists FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- ARTWORKS POLICIES
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for artworks" ON artworks;
DROP POLICY IF EXISTS "Admin only for artworks" ON artworks;

-- Public read access
CREATE POLICY "Public read access for artworks"
  ON artworks FOR SELECT
  USING (true);

-- Admin only write access (using function to avoid recursion)
CREATE POLICY "Admin only for artworks"
  ON artworks FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- EXHIBITIONS POLICIES
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for exhibitions" ON exhibitions;
DROP POLICY IF EXISTS "Admin only for exhibitions" ON exhibitions;

-- Public read access
CREATE POLICY "Public read access for exhibitions"
  ON exhibitions FOR SELECT
  USING (true);

-- Admin only write access (using function to avoid recursion)
CREATE POLICY "Admin only for exhibitions"
  ON exhibitions FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- BOARDS POLICIES
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for boards" ON boards;
DROP POLICY IF EXISTS "Admin can read all boards" ON boards;
DROP POLICY IF EXISTS "Admin only for boards" ON boards;

-- Public read access (only visible boards)
CREATE POLICY "Public read access for boards"
  ON boards FOR SELECT
  USING (is_visible = true);

-- Admin can read all boards (including hidden) - using function to avoid recursion
CREATE POLICY "Admin can read all boards"
  ON boards FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admin only write access (using function to avoid recursion)
CREATE POLICY "Admin only for boards"
  ON boards FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- ARTICLES POLICIES
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can create articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Admin can manage all articles" ON articles;

-- Public read access
CREATE POLICY "Public read access for articles"
  ON articles FOR SELECT
  USING (true);

-- Authenticated users can create articles
CREATE POLICY "Authenticated users can create articles"
  ON articles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own articles
-- Note: Uses helper function to get email from profiles table, avoiding RLS restrictions
CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (author = public.get_user_email(auth.uid()))
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    (author = public.get_user_email(auth.uid()))
  );

-- Admin can update/delete any article (using function to avoid recursion)
CREATE POLICY "Admin can manage all articles"
  ON articles FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
