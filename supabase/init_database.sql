-- ==============================================================================
-- SPIDERPICKS / SAVIOUR ANALYSIS - MASTER COMPLETE DATABASE INITIALIZATION SCHEMA
-- ==============================================================================
-- This single, unified, idempotent script creates all required tables, ENUM types,
-- indexes, Row Level Security (RLS) policies, helper functions, and triggers
-- for the entire SpiderPicks application from scratch.
--
-- Target Admins automatically granted full access:
--   - williegabriel58@gmail.com
--   - lovedayofana1999@gmail.com
-- ==============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUM: app_role
-- Defines user authorization levels ('user', 'moderator', 'admin').
-- Using a PostgreSQL ENUM provides an interactive dropdown in the Supabase Table Editor.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');
    ELSE
        BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLE: profiles
-- Extends Supabase auth.users with user profile information and settings.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ------------------------------------------------------------------------------
-- 3. TABLE: user_roles
-- Dedicated role management table for fast RBAC lookups and Table Editor editing.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ------------------------------------------------------------------------------
-- 4. TABLE: picks
-- Matches, daily predictions, and VIP banker tips curated by Admins / Tipsters.
-- ------------------------------------------------------------------------------
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
    is_banker BOOLEAN NOT NULL DEFAULT false,
    score_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
    h2h_meetings JSONB NOT NULL DEFAULT '[]'::jsonb,
    h2h_trends JSONB NOT NULL DEFAULT '[]'::jsonb,
    selections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_picks_game_date UNIQUE (home_team, away_team, match_date)
);

CREATE INDEX IF NOT EXISTS idx_picks_date ON public.picks(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_picks_league ON public.picks(league);
CREATE INDEX IF NOT EXISTS idx_picks_is_vip ON public.picks(is_vip);
CREATE INDEX IF NOT EXISTS idx_picks_is_banker ON public.picks(is_banker);

-- ------------------------------------------------------------------------------
-- 5. TABLE: feed_posts
-- Social community posts, betting slips, analysis screenshots, likes, and comments.
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. TABLE: social_links
-- Admin-configurable community channels (Telegram, Facebook, Instagram, X, TikTok).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default social handles
INSERT INTO public.social_links (id, name, handle, url, is_active, description, display_order)
VALUES 
    (
        'telegram',
        'Telegram Official Channel',
        '@spiderpicksofficial',
        'https://t.me/spiderpicksofficial',
        true,
        'Join our official Telegram community for instant daily lock banker picks, odds drops & live match alerts.',
        1
    ),
    (
        'facebook',
        'Facebook Official Page',
        'SpiderPicks Official',
        'https://www.facebook.com/profile.php?id=61595517376075',
        true,
        'Follow our Facebook page for fixtures previews, verified slips reviews, and football community discussion.',
        2
    ),
    (
        'instagram',
        'Instagram',
        '@spiderpicks',
        '',
        false,
        'High-resolution match visuals, winning slip stories, and behind-the-scenes matchday analytics.',
        3
    ),
    (
        'x',
        'X (Twitter)',
        '@spiderpicks',
        '',
        false,
        'Breaking squad news, real-time live match commentary, and instant odds shifts as they happen.',
        4
    ),
    (
        'tiktok',
        'TikTok',
        '@spiderpicks',
        '',
        false,
        'Short-form betting breakdowns, funny football moments, and educational bankroll management guides.',
        5
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    handle = EXCLUDED.handle,
    url = CASE WHEN EXCLUDED.url <> '' THEN EXCLUDED.url ELSE public.social_links.url END,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- ------------------------------------------------------------------------------
-- 7. TABLE: notifications
-- Realtime alerts, broadcast notices, score updates, and system activities.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL indicates global broadcast
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'banker', 'score', 'promo', 'admin', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. TABLE: subscriptions
-- Payment transactions and VIP membership subscriptions (Paystack / Cards).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ref ON public.subscriptions(reference);

-- ------------------------------------------------------------------------------
-- 9. TABLE: saved_picks
-- Bookmarked tips and accumulator bets saved by users.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pick_id BIGINT REFERENCES public.picks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, pick_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_picks_user ON public.saved_picks(user_id);

-- ------------------------------------------------------------------------------
-- 10. TABLES: leagues, teams, fixtures, predictions (Match Analysis Engine)
-- ------------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.teams (
    id BIGINT PRIMARY KEY,
    league_id BIGINT REFERENCES public.leagues(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    short_code TEXT,
    logo TEXT,
    stadium TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.fixtures (
    id BIGINT PRIMARY KEY,
    league_id BIGINT NOT NULL REFERENCES public.leagues(id),
    home_team_id BIGINT NOT NULL REFERENCES public.teams(id),
    away_team_id BIGINT NOT NULL REFERENCES public.teams(id),
    kickoff_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'NS',
    elapsed INTEGER,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue TEXT,
    round TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id BIGINT NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
    market TEXT NOT NULL,
    selection TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 1 AND 100),
    odds NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    reasoning TEXT,
    is_banker BOOLEAN NOT NULL DEFAULT false,
    is_vip BOOLEAN NOT NULL DEFAULT false,
    result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'won', 'lost', 'void')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. RBAC HELPER FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- Check if user is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = target_user_id AND role = 'admin'::public.app_role
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = target_user_id AND (role = 'admin'::public.app_role OR subscription_tier = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a Moderator or Administrator
CREATE OR REPLACE FUNCTION public.is_moderator(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = target_user_id AND role IN ('admin'::public.app_role, 'moderator'::public.app_role)
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = target_user_id AND (role = 'admin'::public.app_role OR subscription_tier = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function for Admins to change any user's role atomically
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void AS $$
DECLARE
    parsed_role public.app_role;
BEGIN
    -- Ensure caller is an admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Only administrators can modify roles.';
    END IF;

    IF new_role NOT IN ('user', 'moderator', 'admin') THEN
        RAISE EXCEPTION 'Invalid role specified: %', new_role;
    END IF;

    parsed_role := new_role::public.app_role;

    -- Upsert in user_roles
    INSERT INTO public.user_roles (user_id, role, assigned_by, updated_at)
    VALUES (target_user_id, parsed_role, auth.uid(), timezone('utc'::text, now()))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role, 
        assigned_by = EXCLUDED.assigned_by,
        updated_at = EXCLUDED.updated_at;

    -- Sync to profiles table
    UPDATE public.profiles
    SET role = parsed_role, updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 12. USER SIGNUP & ADMIN BOOTSTRAP TRIGGERS
-- ==============================================================================

-- Trigger Function: Executed whenever ANY new user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.app_role;
    assigned_tier text;
    user_email text;
BEGIN
    user_email := lower(COALESCE(NEW.email, ''));

    -- Check if this email is one of the designated Master Admins
    IF user_email IN ('williegabriel58@gmail.com', 'lovedayofana1999@gmail.com') THEN
        assigned_role := 'admin'::public.app_role;
        assigned_tier := 'admin';
    ELSE
        assigned_role := 'user'::public.app_role;
        assigned_tier := 'free';
    END IF;

    -- 1. Create or update profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        subscription_tier, 
        avatar_url
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        assigned_role,
        assigned_tier,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        role = assigned_role,
        subscription_tier = CASE WHEN assigned_role = 'admin'::public.app_role THEN 'admin' ELSE profiles.subscription_tier END;

    -- 2. Create or update user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id) DO UPDATE SET
        role = assigned_role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Promote designated emails immediately if their accounts already exist in auth.users
DO $$
DECLARE
    target_emails TEXT[] := ARRAY['williegabriel58@gmail.com', 'lovedayofana1999@gmail.com'];
    t_email TEXT;
    target_id UUID;
BEGIN
    FOREACH t_email IN ARRAY target_emails
    LOOP
        SELECT id INTO target_id 
        FROM auth.users 
        WHERE lower(email) = lower(t_email) 
        LIMIT 1;

        IF target_id IS NOT NULL THEN
            -- Update profile
            INSERT INTO public.profiles (id, email, role, subscription_tier)
            VALUES (target_id, t_email, 'admin'::public.app_role, 'admin')
            ON CONFLICT (id) DO UPDATE SET 
                role = 'admin'::public.app_role,
                subscription_tier = 'admin';

            -- Upsert into user_roles
            INSERT INTO public.user_roles (user_id, role, updated_at)
            VALUES (target_id, 'admin'::public.app_role, timezone('utc'::text, now()))
            ON CONFLICT (user_id) DO UPDATE SET 
                role = 'admin'::public.app_role,
                updated_at = timezone('utc'::text, now());

            RAISE NOTICE 'Successfully granted Admin privileges to % (User ID: %)', t_email, target_id;
        ELSE
            RAISE NOTICE 'Target admin % is not yet registered. The signup trigger will grant Admin access upon registration.', t_email;
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- 13.1 Profiles RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
    CREATE POLICY "Profiles read policy" ON public.profiles
        FOR SELECT USING (
            auth.uid() = id 
            OR public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );

    DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
    CREATE POLICY "Profiles update policy" ON public.profiles
        FOR UPDATE USING (
            auth.uid() = id 
            OR public.is_admin(auth.uid())
        );

    DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
    CREATE POLICY "Profiles insert policy" ON public.profiles
        FOR INSERT WITH CHECK (
            auth.uid() = id 
            OR public.is_admin(auth.uid())
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.2 user_roles RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "User roles read policy" ON public.user_roles;
    CREATE POLICY "User roles read policy" ON public.user_roles
        FOR SELECT USING (
            auth.uid() = user_id 
            OR public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );

    DROP POLICY IF EXISTS "User roles manage policy" ON public.user_roles;
    CREATE POLICY "User roles manage policy" ON public.user_roles
        FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.3 picks RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read picks" ON public.picks;
    CREATE POLICY "Public read picks" ON public.picks
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Staff manage picks" ON public.picks;
    CREATE POLICY "Staff manage picks" ON public.picks
        FOR ALL USING (
            public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.4 feed_posts RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read feed posts" ON public.feed_posts;
    CREATE POLICY "Public read feed posts" ON public.feed_posts
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can insert feed posts" ON public.feed_posts;
    CREATE POLICY "Anyone can insert feed posts" ON public.feed_posts
        FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Anyone can update feed posts for reactions" ON public.feed_posts;
    CREATE POLICY "Anyone can update feed posts for reactions" ON public.feed_posts
        FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Staff delete feed posts" ON public.feed_posts;
    CREATE POLICY "Staff delete feed posts" ON public.feed_posts
        FOR DELETE USING (
            public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.5 social_links RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read social links" ON public.social_links;
    CREATE POLICY "Public read social links" ON public.social_links
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Staff manage social links" ON public.social_links;
    CREATE POLICY "Staff manage social links" ON public.social_links
        FOR ALL USING (
            public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.6 notifications RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "User read notifications" ON public.notifications;
    CREATE POLICY "User read notifications" ON public.notifications
        FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

    DROP POLICY IF EXISTS "User update own notifications" ON public.notifications;
    CREATE POLICY "User update own notifications" ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Staff create notifications" ON public.notifications;
    CREATE POLICY "Staff create notifications" ON public.notifications
        FOR INSERT WITH CHECK (
            public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.7 subscriptions RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "User read own subscriptions" ON public.subscriptions;
    CREATE POLICY "User read own subscriptions" ON public.subscriptions
        FOR SELECT USING (
            auth.uid() = user_id 
            OR public.is_admin(auth.uid())
        );

    DROP POLICY IF EXISTS "User insert own subscription" ON public.subscriptions;
    CREATE POLICY "User insert own subscription" ON public.subscriptions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.8 saved_picks RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "User manage saved picks" ON public.saved_picks;
    CREATE POLICY "User manage saved picks" ON public.saved_picks
        FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13.9 leagues, teams, fixtures, predictions RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read leagues" ON public.leagues;
    CREATE POLICY "Public read leagues" ON public.leagues FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read teams" ON public.teams;
    CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read fixtures" ON public.fixtures;
    CREATE POLICY "Public read fixtures" ON public.fixtures FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Read predictions" ON public.predictions;
    CREATE POLICY "Read predictions" ON public.predictions FOR SELECT
        USING (
            NOT is_vip 
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.subscription_tier IN ('pro', 'vip', 'admin')
            )
            OR public.is_admin(auth.uid())
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 14. SUPABASE REALTIME REPLICATION SETUP
-- Enables live updates for notifications, posts, picks, socials, and roles.
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_links;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.picks;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
