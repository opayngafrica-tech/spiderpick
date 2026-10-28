-- Migration: 007_convert_role_to_app_role_enum.sql
-- Description: Converts role columns in public.user_roles and public.profiles from TEXT to 
-- native PostgreSQL ENUM public.app_role ('user', 'moderator', 'admin').
-- This enables the native Supabase Table Editor selection dropdown (matching your screenshot).

-- 1. Create the public.app_role ENUM type if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');
    ELSE
        -- Ensure all three values are present in case the enum was created partially
        BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- 2. Clean up user_roles duplicates and ensure UNIQUE (user_id)
DO $$
BEGIN
    -- Deduplicate user_roles if multiple rows exist for the same user_id
    DELETE FROM public.user_roles a USING public.user_roles b
    WHERE a.user_id = b.user_id AND a.created_at < b.created_at;

    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_unique;
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Convert public.user_roles.role column to public.app_role ENUM
DO $$
BEGIN
    -- Drop old check constraint and default
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
    ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

    -- Alter column type to app_role
    ALTER TABLE public.user_roles 
        ALTER COLUMN role TYPE public.app_role 
        USING (
            CASE 
                WHEN role::text = 'admin' THEN 'admin'::public.app_role
                WHEN role::text = 'moderator' THEN 'moderator'::public.app_role
                ELSE 'user'::public.app_role
            END
        );

    -- Set new enum default
    ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::public.app_role;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Notice altering user_roles.role: %', SQLERRM;
END $$;

-- 4. Convert public.profiles.role column to public.app_role ENUM
DO $$
BEGIN
    -- Drop old check constraint and default
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

    -- Alter column type to app_role
    ALTER TABLE public.profiles 
        ALTER COLUMN role TYPE public.app_role 
        USING (
            CASE 
                WHEN role::text = 'admin' THEN 'admin'::public.app_role
                WHEN role::text = 'moderator' THEN 'moderator'::public.app_role
                ELSE 'user'::public.app_role
            END
        );

    -- Set new enum default
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::public.app_role;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Notice altering profiles.role: %', SQLERRM;
END $$;

-- 5. Helper Functions for RBAC checks in PostgreSQL / RLS
CREATE OR REPLACE FUNCTION public.has_role(check_role text, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = target_user_id AND role::text = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = target_user_id AND role::text = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = target_user_id AND (role::text = 'admin' OR subscription_tier = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = target_user_id AND role::text IN ('admin', 'moderator')
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = target_user_id AND (role::text = 'admin' OR subscription_tier = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC Function: set_user_role
-- Allows atomic assignment of user role across both user_roles and profiles tables
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void AS $$
DECLARE
    parsed_role public.app_role;
BEGIN
    -- Validate role value
    IF new_role NOT IN ('user', 'moderator', 'admin') THEN
        RAISE EXCEPTION 'Invalid role specified: %', new_role;
    END IF;

    parsed_role := new_role::public.app_role;

    -- Upsert into user_roles
    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES (target_user_id, parsed_role, timezone('utc'::text, now()))
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role, updated_at = EXCLUDED.updated_at;

    -- Sync profiles table
    UPDATE public.profiles
    SET role = parsed_role, updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update triggers to use public.app_role default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user'::public.app_role,
        'free'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Ensure user_roles is part of Supabase Realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
