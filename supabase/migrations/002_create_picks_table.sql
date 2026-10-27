-- Saviour Analysis / SpiderPicks PostgreSQL Schema
-- Migration: 002_create_picks_table.sql
-- Supports Bulk Upload Picks with H2H meetings, trends, score projections, and statistical selections

CREATE TABLE IF NOT EXISTS public.picks (
    id BIGSERIAL PRIMARY KEY,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT NOT NULL,
    match_date DATE NOT NULL,
    match_time TEXT NOT NULL,
    tip TEXT NOT NULL,
    odds NUMERIC(6, 2) NOT NULL DEFAULT 1.50,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'p' CHECK (status IN ('p', 'won', 'lost')),
    is_vip BOOLEAN NOT NULL DEFAULT false,
    score_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
    h2h_meetings JSONB NOT NULL DEFAULT '[]'::jsonb,
    h2h_trends JSONB NOT NULL DEFAULT '[]'::jsonb,
    selections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_picks_game_date UNIQUE (home_team, away_team, match_date)
);

-- Index for date queries and league filtering
CREATE INDEX IF NOT EXISTS idx_picks_date ON public.picks(match_date);
CREATE INDEX IF NOT EXISTS idx_picks_league ON public.picks(league);
CREATE INDEX IF NOT EXISTS idx_picks_status ON public.picks(status);
CREATE INDEX IF NOT EXISTS idx_picks_is_vip ON public.picks(is_vip);

-- Enable Row Level Security (RLS)
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- 1. Public can read all published picks
CREATE POLICY "Public read picks" ON public.picks
    FOR SELECT
    USING (true);

-- 2. Only authenticated admins can insert/update/delete picks
CREATE POLICY "Admin write picks" ON public.picks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.subscription_tier = 'admin')
        )
    );
