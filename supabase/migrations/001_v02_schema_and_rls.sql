-- ====================================================================
-- KinoVibe v0.2 Database Schema & Row Level Security Migration
-- ====================================================================

-- 1. PROFILES TABLE (User profiles & Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true)
  WITH CHECK (auth.uid() = id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Helper function: check if caller is an admin (SECURITY DEFINER bypasses recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically create profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing auth.users if any exist
INSERT INTO public.profiles (id, email, display_name)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1) as display_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 2. MOVIES TABLE ENHANCEMENTS & SCHEMA FIXES
-- Ensure base table exists
CREATE TABLE IF NOT EXISTS public.movies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '',
  year integer,
  poster_url text DEFAULT '',
  backdrop_url text DEFAULT '',
  overview text DEFAULT '',
  genres jsonb DEFAULT '[]'::jsonb,
  runtime integer,
  tmdb_id integer,
  review_text text DEFAULT '',
  story_score numeric DEFAULT 5,
  visual_score numeric DEFAULT 5,
  action_score numeric DEFAULT 5,
  fun_score numeric DEFAULT 5,
  biases jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  base_score numeric(3,1) DEFAULT 5.0,
  final_score numeric(3,1) DEFAULT 5.0,
  is_public boolean DEFAULT true,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns safely if the table already existed in v0.1
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movies' AND column_name='tags') THEN
    ALTER TABLE public.movies ADD COLUMN tags text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movies' AND column_name='base_score') THEN
    ALTER TABLE public.movies ADD COLUMN base_score numeric(3,1) DEFAULT 5.0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movies' AND column_name='final_score') THEN
    ALTER TABLE public.movies ADD COLUMN final_score numeric(3,1) DEFAULT 5.0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movies' AND column_name='is_public') THEN
    ALTER TABLE public.movies ADD COLUMN is_public boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movies' AND column_name='status') THEN
    ALTER TABLE public.movies ADD COLUMN status text DEFAULT 'completed';
  END IF;
END $$;

-- 3. CHECK CONSTRAINTS FOR DATA INTEGRITY
DO $$
BEGIN
  -- Score bounds: 0 to 10
  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_story_score;
  ALTER TABLE public.movies ADD CONSTRAINT check_story_score CHECK (story_score >= 0 AND story_score <= 10);

  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_visual_score;
  ALTER TABLE public.movies ADD CONSTRAINT check_visual_score CHECK (visual_score >= 0 AND visual_score <= 10);

  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_action_score;
  ALTER TABLE public.movies ADD CONSTRAINT check_action_score CHECK (action_score >= 0 AND action_score <= 10);

  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_fun_score;
  ALTER TABLE public.movies ADD CONSTRAINT check_fun_score CHECK (fun_score >= 0 AND fun_score <= 10);

  -- Title non-empty
  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_title_non_empty;
  ALTER TABLE public.movies ADD CONSTRAINT check_title_non_empty CHECK (length(trim(title)) > 0);

  -- Valid year bounds
  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_valid_year;
  ALTER TABLE public.movies ADD CONSTRAINT check_valid_year CHECK (year IS NULL OR (year >= 1888 AND year <= 2100));

  -- Valid status
  ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS check_movie_status;
  ALTER TABLE public.movies ADD CONSTRAINT check_movie_status CHECK (status IN ('completed', 'watchlist', 'dropped'));
END $$;


-- 4. AUTOMATIC SCORE CALCULATION TRIGGER
-- Calculates base_score and final_score on INSERT / UPDATE server-side
CREATE OR REPLACE FUNCTION public.calculate_movie_scores()
RETURNS trigger AS $$
DECLARE
  v_story numeric;
  v_visuals numeric;
  v_action numeric;
  v_fun numeric;
  v_bias_total numeric := 0;
  v_bias_elem jsonb;
  v_amount numeric;
  v_base numeric;
  v_final numeric;
BEGIN
  v_story := COALESCE(NEW.story_score, 5);
  v_visuals := COALESCE(NEW.visual_score, 5);
  v_action := COALESCE(NEW.action_score, 5);
  v_fun := COALESCE(NEW.fun_score, 5);

  -- Sum all biases in jsonb array
  IF NEW.biases IS NOT NULL AND jsonb_typeof(NEW.biases) = 'array' THEN
    FOR v_bias_elem IN SELECT * FROM jsonb_array_elements(NEW.biases)
    LOOP
      IF jsonb_typeof(v_bias_elem) = 'object' AND v_bias_elem ? 'amount' THEN
        BEGIN
          v_amount := (v_bias_elem->>'amount')::numeric;
          v_bias_total := v_bias_total + COALESCE(v_amount, 0);
        EXCEPTION WHEN OTHERS THEN
          -- Ignore invalid numeric bias
        END;
      END IF;
    END LOOP;
  END IF;

  -- Formula:
  -- Base = (Story + Visuals + Action + Fun) / 4
  -- Final = clamp(0, 10, (Story + Visuals + Action + Fun + totalBias) / 4)
  v_base := ROUND(((v_story + v_visuals + v_action + v_fun) / 4.0), 1);
  v_final := ROUND(((v_story + v_visuals + v_action + v_fun + v_bias_total) / 4.0), 1);

  -- Clamp final score between 0.0 and 10.0
  IF v_final < 0.0 THEN
    v_final := 0.0;
  ELSIF v_final > 10.0 THEN
    v_final := 10.0;
  END IF;

  NEW.base_score := v_base;
  NEW.final_score := v_final;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_movie_scores ON public.movies;
CREATE TRIGGER trg_calculate_movie_scores
  BEFORE INSERT OR UPDATE ON public.movies
  FOR EACH ROW EXECUTE FUNCTION public.calculate_movie_scores();

-- Trigger update on all existing rows to backfill base_score and final_score
UPDATE public.movies SET updated_at = now();


-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON public.movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_final_score ON public.movies(user_id, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_movies_user_created ON public.movies(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_is_public ON public.movies(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_movies_tags_gin ON public.movies USING GIN (tags);


-- 6. ROW LEVEL SECURITY POLICIES (Hardened & RBAC-aware)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Clean up legacy policies
DROP POLICY IF EXISTS "Users can view their own movies" ON public.movies;
DROP POLICY IF EXISTS "Users can insert their own movies" ON public.movies;
DROP POLICY IF EXISTS "Users can update their own movies" ON public.movies;
DROP POLICY IF EXISTS "Users can delete their own movies" ON public.movies;
DROP POLICY IF EXISTS "Allow users to read own movies or public reviews" ON public.movies;
DROP POLICY IF EXISTS "Allow users or admins to update movies" ON public.movies;
DROP POLICY IF EXISTS "Allow users or admins to delete movies" ON public.movies;

-- SELECT Policy: A user can view their own movies, ANY public movie, or ALL movies if admin
CREATE POLICY "Allow users to read own movies or public reviews"
  ON public.movies FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
    OR public.is_admin()
  );

-- INSERT Policy: Authenticated users can insert for themselves
CREATE POLICY "Users can insert their own movies"
  ON public.movies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- UPDATE Policy: User can update their own movies (cannot reassign user_id) or Admin can update
CREATE POLICY "Allow users or admins to update movies"
  ON public.movies FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  )
  WITH CHECK (
    (auth.uid() = user_id AND user_id = (SELECT m.user_id FROM public.movies m WHERE m.id = id))
    OR public.is_admin()
  );

-- DELETE Policy: User can delete their own movies, or Admin can delete
CREATE POLICY "Allow users or admins to delete movies"
  ON public.movies FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- ====================================================================
-- End of Migration
-- ====================================================================
