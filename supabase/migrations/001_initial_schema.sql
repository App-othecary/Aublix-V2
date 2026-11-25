-- =============================================================================
-- Aublix: Public-Domain Audiobook Streaming App
-- Supabase PostgreSQL Schema + Row Level Security (RLS) Migration
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with display preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_speed NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'Reader'), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. SAVED BOOKS TABLE (User Library / Bookmarks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  book_snapshot JSONB,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_saved_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_books_user_id ON public.saved_books(user_id, saved_at DESC);

ALTER TABLE public.saved_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saved books"
  ON public.saved_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save books to their own library"
  ON public.saved_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove books from their own library"
  ON public.saved_books FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. LISTENING PROGRESS TABLE (Exact Timestamp & Chapter Sync)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listening_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  chapter_title TEXT,
  position_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  chapter_duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_elapsed_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_book_duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  playback_speed NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  book_snapshot JSONB,
  last_listened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_book_progress UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_listening_progress_user_recent
  ON public.listening_progress(user_id, last_listened_at DESC);

ALTER TABLE public.listening_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own listening progress"
  ON public.listening_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listening progress"
  ON public.listening_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listening progress"
  ON public.listening_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listening progress"
  ON public.listening_progress FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. UPDATED_AT TIMESTAMP HELPER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
