-- Fix security issues by enabling RLS on all tables that are missing it

-- Enable RLS on admin_profiles table (this table seems to be missing from the schema but referenced in functions)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_profiles
CREATE POLICY "Only admins can view admin profiles" ON public.admin_profiles
FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can manage admin profiles" ON public.admin_profiles
FOR ALL USING (is_admin());

-- Enable RLS on all other public tables (they might have been disabled)
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;