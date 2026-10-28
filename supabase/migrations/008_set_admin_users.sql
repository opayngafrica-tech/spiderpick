-- Migration: 008_set_admin_users.sql
-- Description: Assigns full Administrator privileges to:
-- 1. williegabriel58@gmail.com
-- 2. lovedayofana1999@gmail.com
-- Updates both public.profiles and public.user_roles tables,
-- and adds an automatic signup trigger so they are admins even if they register later.

-- 1. Update existing registered users
DO $$
DECLARE
    target_emails TEXT[] := ARRAY['williegabriel58@gmail.com', 'lovedayofana1999@gmail.com'];
    t_email TEXT;
    target_id UUID;
    has_app_role BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') INTO has_app_role;

    FOREACH t_email IN ARRAY target_emails
    LOOP
        -- Find user ID from auth.users
        SELECT id INTO target_id 
        FROM auth.users 
        WHERE lower(email) = lower(t_email) 
        LIMIT 1;

        IF target_id IS NOT NULL THEN
            IF has_app_role THEN
                -- Upsert profiles
                INSERT INTO public.profiles (id, email, role, subscription_tier)
                VALUES (target_id, t_email, 'admin'::public.app_role, 'admin')
                ON CONFLICT (id) DO UPDATE SET 
                    role = 'admin'::public.app_role,
                    subscription_tier = 'admin';

                -- Upsert user_roles
                INSERT INTO public.user_roles (user_id, role, updated_at)
                VALUES (target_id, 'admin'::public.app_role, timezone('utc'::text, now()))
                ON CONFLICT (user_id) DO UPDATE SET 
                    role = 'admin'::public.app_role,
                    updated_at = timezone('utc'::text, now());
            ELSE
                -- Fallback if app_role enum not yet created
                INSERT INTO public.profiles (id, email, role, subscription_tier)
                VALUES (target_id, t_email, 'admin', 'admin')
                ON CONFLICT (id) DO UPDATE SET 
                    role = 'admin',
                    subscription_tier = 'admin';

                INSERT INTO public.user_roles (user_id, role, updated_at)
                VALUES (target_id, 'admin', timezone('utc'::text, now()))
                ON CONFLICT (user_id) DO UPDATE SET 
                    role = 'admin',
                    updated_at = timezone('utc'::text, now());
            END IF;

            RAISE NOTICE 'Successfully granted Admin privileges to % (ID: %)', t_email, target_id;
        ELSE
            RAISE NOTICE 'User % has not signed up yet. Signup trigger will automatically make them Admin.', t_email;
        END IF;
    END LOOP;
END $$;

-- 2. Trigger to automatically grant Admin on new signup if email matches
CREATE OR REPLACE FUNCTION public.handle_admin_bootstrap_signup()
RETURNS TRIGGER AS $$
DECLARE
    has_app_role BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') INTO has_app_role;

    IF lower(NEW.email) IN ('williegabriel58@gmail.com', 'lovedayofana1999@gmail.com') THEN
        IF has_app_role THEN
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
        ELSE
            INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
                'admin',
                'admin'
            )
            ON CONFLICT (id) DO UPDATE SET 
                role = 'admin',
                subscription_tier = 'admin';

            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.id, 'admin')
            ON CONFLICT (user_id) DO UPDATE SET 
                role = 'admin';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_admin_bootstrap ON auth.users;
CREATE TRIGGER on_auth_user_admin_bootstrap
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_bootstrap_signup();
