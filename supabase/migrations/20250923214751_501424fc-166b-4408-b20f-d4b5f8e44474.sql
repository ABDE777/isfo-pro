-- Disable RLS temporarily for testing on student flows
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_requests DISABLE ROW LEVEL SECURITY;