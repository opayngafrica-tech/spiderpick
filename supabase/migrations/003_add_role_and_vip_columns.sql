-- Saviour Analysis / SpiderPicks PostgreSQL Schema
-- Migration: 003_add_role_and_vip_columns.sql
-- Adds role column to profiles, adds is_vip to picks table, and ensures proper RLS policies & triggers

-- 1. Add role column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- 2. Update subscription_tier check constraint on profiles to allow 'admin'
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check 
        CHECK (subscription_tier IN ('free', 'pro', 'vip', 'admin'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Add is_vip column to picks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'picks' AND column_name = 'is_vip'
    ) THEN
        ALTER TABLE public.picks ADD COLUMN is_vip BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 4. Create index on is_vip
CREATE INDEX IF NOT EXISTS idx_picks_is_vip ON public.picks(is_vip);

-- 5. Ensure profile INSERT and SELECT policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    CREATE POLICY "Users can insert own profile" ON public.profiles 
        FOR INSERT WITH CHECK (auth.uid() = id);

    DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
    CREATE POLICY "Public profiles read" ON public.profiles 
        FOR SELECT USING (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 6. Trigger to automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user',
        'free'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Update picks admin policy to check role = 'admin' or subscription_tier = 'admin'
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admin write picks" ON public.picks;
    CREATE POLICY "Admin write picks" ON public.picks
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.subscription_tier = 'admin')
            )
        );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
