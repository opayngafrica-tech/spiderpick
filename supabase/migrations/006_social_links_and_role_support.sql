-- Saviour Analysis / SpiderPicks PostgreSQL Schema
-- Migration: 006_social_links_and_role_support.sql
-- Description:
-- 1. Updates profiles role check to support ('user', 'moderator', 'admin')
-- 2. Creates social_links table for admin-configurable channels (Telegram, Facebook, Instagram, X, TikTok)
-- 3. Enables Supabase Realtime for social_links and notifications
-- 4. Allows broadcast notifications (nullable user_id)

-- 1. Update profiles table role check constraint to include 'moderator'
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'moderator', 'admin'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Create social_links table
CREATE TABLE IF NOT EXISTS public.social_links (
    id TEXT PRIMARY KEY, -- 'telegram', 'facebook', 'instagram', 'x', 'tiktok'
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Seed default social handles
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
    url = EXCLUDED.url,
    handle = EXCLUDED.handle,
    description = EXCLUDED.description;

-- 4. Enable RLS on social_links
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read social links" ON public.social_links;
    CREATE POLICY "Public read social links" ON public.social_links 
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Admins manage social links" ON public.social_links;
    CREATE POLICY "Admins manage social links" ON public.social_links 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.subscription_tier = 'admin')
            )
            OR
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
            )
        );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. Update notifications table to allow broadcast alerts (nullable user_id)
DO $$
BEGIN
    -- Make user_id nullable so broadcast notifications can be received by everyone
    ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;

    DROP POLICY IF EXISTS "User manage notifications" ON public.notifications;
    DROP POLICY IF EXISTS "User read notifications" ON public.notifications;
    
    CREATE POLICY "User read notifications" ON public.notifications
        FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

    DROP POLICY IF EXISTS "User update own notifications" ON public.notifications;
    CREATE POLICY "User update own notifications" ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins write notifications" ON public.notifications;
    CREATE POLICY "Admins write notifications" ON public.notifications
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.subscription_tier = 'admin')
            )
            OR
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator')
            )
        );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 6. Add social_links and notifications to Supabase Realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_links;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
