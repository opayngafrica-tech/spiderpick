-- Migration: 008_set_admin_users.sql
-- Description: Self-contained script to:
-- 1. Ensure public.app_role ENUM type exists ('user', 'moderator', 'admin')
-- 2. Create public.user_roles table if it does not exist yet (with selection dropdown support)
-- 3. Assign full Administrator privileges to:
--    - williegabriel58@gmail.com
--    - lovedayofana1999@gmail.com
-- 4. Set up an automatic signup trigger so they are automatically made Admins upon registration.

-- 1. Create app_role ENUM type if not exists
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

-- 2. Create public.user_roles table if it does not exist
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

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Update public.profiles.role column to app_role ENUM if needed
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.profiles 
        ALTER COLUMN role TYPE public.app_role 
        USING (
            CASE 
                WHEN role::text = 'admin' THEN 'admin'::public.app_role
                WHEN role::text = 'moderator' THEN 'moderator'::public.app_role
                ELSE 'user'::public.app_role
            END
        );
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::public.app_role;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Helper Functions for RBAC checks in PostgreSQL / RLS
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

-- RLS Policies on user_roles
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can read own roles or admins read all" ON public.user_roles;
    CREATE POLICY "Users can read own roles or admins read all" ON public.user_roles
        FOR SELECT USING (
            auth.uid() = user_id 
            OR public.is_admin(auth.uid()) 
            OR public.is_moderator(auth.uid())
        );

    DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
    CREATE POLICY "Admins can manage user roles" ON public.user_roles
        FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. RPC function to safely set user role
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void AS $$
DECLARE
    parsed_role public.app_role;
BEGIN
    IF new_role NOT IN ('user', 'moderator', 'admin') THEN
        RAISE EXCEPTION 'Invalid role specified: %', new_role;
    END IF;

    parsed_role := new_role::public.app_role;

    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES (target_user_id, parsed_role, timezone('utc'::text, now()))
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role, updated_at = EXCLUDED.updated_at;

    UPDATE public.profiles
    SET role = parsed_role, updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Assign williegabriel58@gmail.com and lovedayofana1999@gmail.com as ADMIN
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
            -- Update profiles
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

            RAISE NOTICE 'Granted Admin privileges to % (ID: %)', t_email, target_id;
        ELSE
            RAISE NOTICE 'User % has not signed up yet. Signup trigger will automatically make them Admin.', t_email;
        END IF;
    END LOOP;
END $$;

-- 7. Automatic signup trigger: grants Admin immediately when either email registers
CREATE OR REPLACE FUNCTION public.handle_admin_bootstrap_signup()
RETURNS TRIGGER AS $$
BEGIN
    IF lower(NEW.email) IN ('williegabriel58@gmail.com', 'lovedayofana1999@gmail.com') THEN
        INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'admin'::public.app_role,
            'admin'
        )
        ON CONFLICT (id) DO UPDATE SET 
            role = 'admin'::public.app_role,
            subscription_tier = 'admin';

        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin'::public.app_role)
        ON CONFLICT (user_id) DO UPDATE SET 
            role = 'admin'::public.app_role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_admin_bootstrap ON auth.users;
CREATE TRIGGER on_auth_user_admin_bootstrap
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_bootstrap_signup();

-- 8. Add user_roles to Supabase Realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
