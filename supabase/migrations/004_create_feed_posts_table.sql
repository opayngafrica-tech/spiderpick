-- Saviour Analysis / SpiderPicks PostgreSQL Schema
-- Migration: 004_create_feed_posts_table.sql
-- Creates feed_posts table for user community posts, tips, booking codes, likes, and comments

CREATE TABLE IF NOT EXISTS public.feed_posts (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_email TEXT,
    caption TEXT,
    img TEXT,
    imgs JSONB NOT NULL DEFAULT '[]'::jsonb,
    booking_code TEXT,
    bookmaker TEXT NOT NULL DEFAULT 'SportyBet',
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for timeline queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can read community feed posts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read feed posts" ON public.feed_posts;
    CREATE POLICY "Public read feed posts" ON public.feed_posts
        FOR SELECT
        USING (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Authenticated users and guests can insert feed posts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Insert feed posts" ON public.feed_posts;
    CREATE POLICY "Insert feed posts" ON public.feed_posts
        FOR INSERT
        WITH CHECK (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Users can update feed posts (for likes & comments)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Update feed posts" ON public.feed_posts;
    CREATE POLICY "Update feed posts" ON public.feed_posts
        FOR UPDATE
        USING (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Users can delete feed posts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Delete feed posts" ON public.feed_posts;
    CREATE POLICY "Delete feed posts" ON public.feed_posts
        FOR DELETE
        USING (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. Enable Realtime Replication for feed_posts table
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
