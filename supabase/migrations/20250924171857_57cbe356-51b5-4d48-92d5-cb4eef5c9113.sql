-- Réactiver RLS sur les tables importantes pour la sécurité
-- Cette migration corrige les problèmes de sécurité détectés

-- Réactiver RLS sur la table students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Réactiver RLS sur la table attestation_requests  
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;

-- Réactiver RLS sur la table admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Réactiver RLS sur la table attestation_counter
ALTER TABLE public.attestation_counter ENABLE ROW LEVEL SECURITY;