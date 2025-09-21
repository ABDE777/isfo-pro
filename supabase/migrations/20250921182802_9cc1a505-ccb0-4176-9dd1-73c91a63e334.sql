-- Clean up database schema by removing unused columns and optimizing tables

-- Remove unused columns from attestation_requests if they exist
-- Note: verification_code column seems unused in attestation_requests as verification_codes has its own table
ALTER TABLE public.attestation_requests DROP COLUMN IF EXISTS verification_code;

-- Ensure all necessary constraints and indexes are in place
-- Add index on student_id for better performance
CREATE INDEX IF NOT EXISTS idx_attestation_requests_student_id ON public.attestation_requests(student_id);

-- Add index on email for students table for better performance  
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- Add index on verification_codes email and expires_at for better performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Add proper foreign key constraint between attestation_requests and students
ALTER TABLE public.attestation_requests 
ADD CONSTRAINT fk_attestation_requests_student_id 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Ensure proper data types and constraints
ALTER TABLE public.attestation_requests 
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.students 
ALTER COLUMN formation_mode SET DEFAULT 'Diplômante';

-- Add trigger to automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to tables that have updated_at columns
DROP TRIGGER IF EXISTS update_attestation_requests_updated_at ON public.attestation_requests;
CREATE TRIGGER update_attestation_requests_updated_at
  BEFORE UPDATE ON public.attestation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;  
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_attestation_counter_updated_at ON public.attestation_counter;
CREATE TRIGGER update_attestation_counter_updated_at
  BEFORE UPDATE ON public.attestation_counter
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();