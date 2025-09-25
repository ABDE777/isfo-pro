-- Activer RLS sur toutes les tables qui en ont besoin
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestation_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;