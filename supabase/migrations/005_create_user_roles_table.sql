-- Migration: 005_create_user_roles_table.sql
-- Description: Creates a dedicated user_roles table for granular role-based access control (RBAC).
-- Uses native PostgreSQL ENUM public.app_role ('user', 'moderator', 'admin') so Supabase Table Editor
-- displays an interactive selection dropdown.

-- 1. Create the ENUM type public.app_role if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');
    END IF;
END $$;

-- 2. Create user_roles table with role of type public.app_role
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 4. Helper Functions for RBAC checks in PostgreSQL / RLS
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies on user_roles
DO $$
BEGIN
    -- Allow users to view their own roles, and Admins/Moderators to view all roles
    DROP POLICY IF EXISTS "Users can read own roles or admins read all" ON public.user_roles;
    CREATE POLICY "Users can read own roles or admins read all" ON public.user_roles
        FOR SELECT
        USING (
            auth.uid() = user_id 
            OR public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );

    -- Only Admins can assign, modify, or revoke roles
    DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
    CREATE POLICY "Admins can insert user roles" ON public.user_roles
        FOR INSERT
        WITH CHECK (public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
    CREATE POLICY "Admins can update user roles" ON public.user_roles
        FOR UPDATE
        USING (public.is_admin(auth.uid()))
        WITH CHECK (public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
    CREATE POLICY "Admins can delete user roles" ON public.user_roles
        FOR DELETE
        USING (public.is_admin(auth.uid()));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 7. Trigger to automatically assign 'user' role when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 8. Backfill existing users from profiles into user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    id AS user_id, 
    CASE 
        WHEN role::text = 'admin' OR subscription_tier = 'admin' THEN 'admin'::public.app_role
        WHEN role::text = 'moderator' THEN 'moderator'::public.app_role
        ELSE 'user'::public.app_role
    END AS role
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 9. Add user_roles to Supabase Realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
