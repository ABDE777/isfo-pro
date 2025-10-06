-- Fix security issues from the migration

-- Enable RLS on admin_users table (missing)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Fix the function search path issue for get_student_request_count
CREATE OR REPLACE FUNCTION public.get_student_request_count(student_email TEXT)
RETURNS INTEGER 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.attestation_requests ar
  JOIN public.students s ON s.id = ar.student_id
  WHERE s.email = student_email
  AND ar.year_requested = EXTRACT(YEAR FROM now());
$$;