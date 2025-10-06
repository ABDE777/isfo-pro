-- Re-enable RLS on all public tables to fix security warnings
BEGIN;

-- Enable RLS on all public tables
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

COMMIT;