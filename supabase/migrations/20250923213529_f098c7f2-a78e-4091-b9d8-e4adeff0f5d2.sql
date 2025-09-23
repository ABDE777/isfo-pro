-- Create a password field in the students table for authentication
ALTER TABLE public.students ADD COLUMN password_hash text;

-- Update RLS policies to work with Supabase Auth
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
DROP POLICY IF EXISTS "Students can submit attestation requests" ON public.attestation_requests;
DROP POLICY IF EXISTS "Students can view their own requests" ON public.attestation_requests;

-- Create new policies that work with auth.uid()
CREATE POLICY "Students can view their own data" 
ON public.students 
FOR SELECT 
USING (auth.uid()::text = id::text OR email = auth.email());

-- Allow students to insert attestation requests if they are authenticated
CREATE POLICY "Authenticated students can submit requests" 
ON public.attestation_requests 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.email = auth.email()
  )
);

-- Allow students to view their own requests
CREATE POLICY "Students can view their own requests" 
ON public.attestation_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.email = auth.email() 
    AND students.cin = attestation_requests.cin
  )
);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS trigger AS $$
BEGIN
  -- Check if this email exists in students table
  IF EXISTS (SELECT 1 FROM public.students WHERE email = NEW.email) THEN
    -- Update the student record with the auth user id
    UPDATE public.students 
    SET id = NEW.id::text
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new auth users
CREATE TRIGGER on_auth_user_created_student
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student_user();