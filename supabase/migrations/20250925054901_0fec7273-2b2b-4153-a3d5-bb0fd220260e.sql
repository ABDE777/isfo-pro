-- Make admin_profiles compatible with app's AdminLogin and seed allowed admins
BEGIN;

-- 1) Allow rows without linking to auth users for admin_profiles
ALTER TABLE public.admin_profiles ALTER COLUMN user_id DROP NOT NULL;

-- 2) Ensure unique profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'admin_profiles_profile_name_key'
  ) THEN
    CREATE UNIQUE INDEX admin_profiles_profile_name_key ON public.admin_profiles (profile_name);
  END IF;
END$$;

-- 3) Relax SELECT policy so AdminLogin (anon) can read the list of allowed profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_profiles' 
      AND policyname = 'Only admins can view admin profiles'
  ) THEN
    DROP POLICY "Only admins can view admin profiles" ON public.admin_profiles;
  END IF;
END$$;

-- Public can view admin profiles list (read-only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_profiles' 
      AND policyname = 'Public can view admin profiles list'
  ) THEN
    CREATE POLICY "Public can view admin profiles list"
      ON public.admin_profiles
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;

-- Keep management of admin_profiles restricted to admins via existing ALL policy using is_admin()

-- 4) Seed only the 4 authorized admin profiles
-- Remove any other profiles
DELETE FROM public.admin_profiles 
WHERE profile_name NOT IN ('DR IBRAHIM','GS KENZA','GS GHIZLANE','ABDELMONIM TEST');

-- Upsert the required profiles
INSERT INTO public.admin_profiles (profile_name, role, user_id)
VALUES
  ('DR IBRAHIM','admin', NULL),
  ('GS KENZA','admin', NULL),
  ('GS GHIZLANE','admin', NULL),
  ('ABDELMONIM TEST','admin', NULL)
ON CONFLICT (profile_name) DO UPDATE 
SET updated_at = now();

-- 5) Update helper to auto-link admins on auth signup if those emails are used
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email IN (
    'ibrahim@isfo.ma',
    'kenza@isfo.ma',
    'ghizlane@isfo.ma',
    'abdelmonim@isfo.ma',
    'abdelmonimtest@isfo.ma'
  ) THEN
    INSERT INTO public.admin_profiles (user_id, profile_name, role)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.email = 'ibrahim@isfo.ma' THEN 'DR IBRAHIM'
        WHEN NEW.email = 'kenza@isfo.ma' THEN 'GS KENZA'
        WHEN NEW.email = 'ghizlane@isfo.ma' THEN 'GS GHIZLANE'
        WHEN NEW.email = 'abdelmonimtest@isfo.ma' THEN 'ABDELMONIM TEST'
        WHEN NEW.email = 'abdelmonim@isfo.ma' THEN 'ABDELMONIM'
      END,
      'admin'
    )
    ON CONFLICT (profile_name) DO UPDATE
    SET user_id = EXCLUDED.user_id, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- 6) Restore FK used by code join alias so AdminDashboard queries work safely
-- Ensure student_id remains nullable and FK uses ON DELETE SET NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'attestation_requests' 
      AND constraint_name = 'attestation_requests_student_id_fkey'
  ) THEN
    ALTER TABLE public.attestation_requests
      ADD CONSTRAINT attestation_requests_student_id_fkey
      FOREIGN KEY (student_id)
      REFERENCES public.students(id)
      ON DELETE SET NULL;
  END IF;
END$$;

COMMIT;