-- Fix remaining RLS issues
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;