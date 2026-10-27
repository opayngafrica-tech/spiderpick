-- Saviour Analysis PostgreSQL Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'vip', 'admin')),
    subscription_expires_at TIMESTAMPTZ,
    odds_format TEXT NOT NULL DEFAULT 'decimal' CHECK (odds_format IN ('decimal', 'fractional', 'american')),
    currency TEXT NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'EUR', 'GBP')),
    notify_kickoff BOOLEAN NOT NULL DEFAULT true,
    notify_bankers BOOLEAN NOT NULL DEFAULT true,
    notify_live_goals BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Leagues Table
CREATE TABLE IF NOT EXISTS public.leagues (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    logo TEXT,
    flag TEXT,
    season INTEGER NOT NULL DEFAULT 2026,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id BIGINT PRIMARY KEY,
    league_id BIGINT REFERENCES public.leagues(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    short_code TEXT,
    logo TEXT,
    stadium TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Fixtures Table
CREATE TABLE IF NOT EXISTS public.fixtures (
    id BIGINT PRIMARY KEY,
    league_id BIGINT NOT NULL REFERENCES public.leagues(id),
    home_team_id BIGINT NOT NULL REFERENCES public.teams(id),
    away_team_id BIGINT NOT NULL REFERENCES public.teams(id),
    kickoff_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'NS', -- NS, 1H, HT, 2H, FT, POSTP, CANC
    elapsed INTEGER,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue TEXT,
    round TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixture_id BIGINT NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
    market TEXT NOT NULL, -- 'Match Result', 'Double Chance', 'Over/Under 2.5', 'BTTS'
    selection TEXT NOT NULL, -- 'Home Win', '1X', 'Over 2.5 Goals', 'Yes'
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 1 AND 100),
    odds NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    reasoning TEXT,
    is_banker BOOLEAN NOT NULL DEFAULT false,
    is_vip BOOLEAN NOT NULL DEFAULT false,
    result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'won', 'lost', 'void')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Saved Picks (User Bookmarks / Slip items)
CREATE TABLE IF NOT EXISTS public.saved_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, prediction_id)
);

-- 7. Subscriptions / Payments Table (Paystack transactions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL CHECK (plan_tier IN ('pro', 'vip')),
    reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
    channel TEXT DEFAULT 'card',
    paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'banker', 'score', 'promo')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON public.fixtures(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_fixtures_league ON public.fixtures(league_id);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON public.predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_vip ON public.predictions(is_vip);
CREATE INDEX IF NOT EXISTS idx_saved_picks_user ON public.saved_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Leagues & Teams & Fixtures: Publicly readable by all authenticated and anon users
CREATE POLICY "Public leagues read" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Public teams read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public fixtures read" ON public.fixtures FOR SELECT USING (true);

-- 3. Predictions:
-- Free users can read non-VIP predictions; VIP/Pro users can read all predictions
CREATE POLICY "Read free predictions" ON public.predictions FOR SELECT
USING (
    NOT is_vip OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.subscription_tier IN ('pro', 'vip')
    )
);

-- 4. Saved Picks: User only
CREATE POLICY "User manage saved picks" ON public.saved_picks
FOR ALL USING (auth.uid() = user_id);

-- 5. Subscriptions: User only
CREATE POLICY "User read subscriptions" ON public.subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- 6. Notifications: User only
CREATE POLICY "User manage notifications" ON public.notifications
FOR ALL USING (auth.uid() = user_id);
