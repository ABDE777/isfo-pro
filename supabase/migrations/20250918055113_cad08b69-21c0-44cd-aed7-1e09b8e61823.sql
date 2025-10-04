-- Fix the infinite recursion in RLS policy by dropping and recreating the policy
-- that was causing the issue

-- Drop the problematic policy
DROP POLICY IF EXISTS "Students can submit attestation requests" ON public.attestation_requests;

-- Create a new policy that uses the existing security definer function instead of self-referencing
CREATE POLICY "Students can submit attestation requests" 
ON public.attestation_requests 
FOR INSERT 
WITH CHECK (
  -- Check if student exists and matches authenticated user
  EXISTS (
    SELECT 1 
    FROM public.students 
    WHERE students.id = attestation_requests.student_id 
    AND students.email = auth.email()
  ) 
  -- Use the existing security definer function to avoid self-reference
  AND public.get_student_request_count(auth.email()) < 3
);