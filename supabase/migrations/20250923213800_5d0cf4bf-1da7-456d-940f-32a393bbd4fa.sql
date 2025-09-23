-- Ensure RLS is enabled on critical tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;

-- Reset student self-view policy to a safe, simple rule
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
CREATE POLICY "Students can view their own data"
ON public.students
FOR SELECT
USING (email = auth.email() OR id = auth.uid());

-- Clean up previous attestation_requests policies and recreate stricter versions
DROP POLICY IF EXISTS "Authenticated students can submit requests" ON public.attestation_requests;
DROP POLICY IF EXISTS "Students can view their own requests" ON public.attestation_requests;

-- Students can only view their own requests (by FK student_id)
CREATE POLICY "Students can view their own requests"
ON public.attestation_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attestation_requests.student_id
      AND s.email = auth.email()
  )
);

-- Students can submit requests only for themselves and within yearly limit
CREATE POLICY "Students can submit attestation requests"
ON public.attestation_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attestation_requests.student_id
      AND s.email = auth.email()
  )
  AND get_student_request_count(auth.email()) < 3
);

-- Fix the helper trigger to attach auth user id to existing student row by email
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.students WHERE email = NEW.email) THEN
    UPDATE public.students
    SET id = NEW.id
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
