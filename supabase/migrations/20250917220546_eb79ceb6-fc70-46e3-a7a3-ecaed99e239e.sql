-- Create students table with complete student data
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cin TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  formation_level TEXT NOT NULL, -- Technicien spécialisé, etc.
  speciality TEXT NOT NULL, -- Développement digital, etc.
  student_group TEXT NOT NULL,
  inscription_number TEXT NOT NULL UNIQUE, -- N° d'inscription comme 2006013000249
  formation_type TEXT NOT NULL DEFAULT 'Résidentielle', -- Résidentielle/Alternance
  formation_mode TEXT NOT NULL DEFAULT 'Diplômante', -- Diplômante/Qualifiante
  formation_year TEXT NOT NULL, -- Année de formation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students can view their own data
CREATE POLICY "Students can view their own data"
ON public.students
FOR SELECT
USING (email = auth.email());

-- Admins can view all students
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
USING (is_admin());

-- Admins can manage students
CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update students"
ON public.students
FOR UPDATE
USING (is_admin());

-- Create verification codes table for 6-digit authentication
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on verification codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
CREATE POLICY "Users can view their own codes"
ON public.verification_codes
FOR SELECT
USING (email = auth.email());

-- Update attestation_requests table to link to students and add limits
ALTER TABLE public.attestation_requests 
ADD COLUMN student_id UUID REFERENCES public.students(id),
ADD COLUMN verification_code TEXT,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN year_requested INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now());

-- Update attestation_requests RLS policies
DROP POLICY IF EXISTS "Only authenticated admins can view requests" ON public.attestation_requests;
DROP POLICY IF EXISTS "Anyone can submit attestation requests" ON public.attestation_requests;

-- Students can view their own requests
CREATE POLICY "Students can view their own requests"
ON public.attestation_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = attestation_requests.student_id 
    AND students.email = auth.email()
  )
);

-- Authenticated students can submit requests (with 3 per year limit)
CREATE POLICY "Students can submit attestation requests"
ON public.attestation_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = attestation_requests.student_id 
    AND students.email = auth.email()
  )
  AND (
    SELECT COUNT(*) 
    FROM public.attestation_requests ar 
    WHERE ar.student_id = attestation_requests.student_id 
    AND ar.year_requested = EXTRACT(YEAR FROM now())
  ) < 3
);

-- Admins can view all requests
CREATE POLICY "Admins can view all attestation requests"
ON public.attestation_requests
FOR SELECT
USING (is_admin());

-- Create function to get student request count for current year
CREATE OR REPLACE FUNCTION public.get_student_request_count(student_email TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.attestation_requests ar
  JOIN public.students s ON s.id = ar.student_id
  WHERE s.email = student_email
  AND ar.year_requested = EXTRACT(YEAR FROM now());
$$ LANGUAGE SQL SECURITY DEFINER;

-- Insert sample student data
INSERT INTO public.students (first_name, last_name, cin, email, birth_date, formation_level, speciality, student_group, inscription_number, formation_year) VALUES
('MAZGOURA', 'ABD EL MONIM', 'AB123456', '2006013000249@ofppt-edu.ma', '2000-06-01', 'Technicien spécialisé', 'Développement digital ou infrastructure digitale ou développement option web full stack ou infrastructure des systèmes', 'DEVOWFS204', '2006013000249', 'Année actuelle année prochaine');

-- Create trigger for updating timestamps
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();