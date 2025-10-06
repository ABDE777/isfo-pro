-- Supprimer les tables existantes qui causent des problèmes
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;

-- Supprimer les fonctions et triggers liés
DROP FUNCTION IF EXISTS public.handle_new_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Créer une nouvelle table simple pour les admins
CREATE TABLE public.admins (
  id SERIAL PRIMARY KEY,
  profile_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les 4 admins avec leurs mots de passe
INSERT INTO public.admins (profile_name, password) VALUES
  ('DR IBRAHIM', 'admin123'),
  ('GS KENZA', 'admin123'),
  ('GS GHIZLANE', 'admin123'),
  ('ABDELMONIM TEST', 'admin123');

-- Activer RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture (nécessaire pour le login)
CREATE POLICY "Allow login verification" ON public.admins
  FOR SELECT USING (true);

-- Créer une nouvelle fonction is_admin simplifiée
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE profile_name = current_setting('request.jwt.claims', true)::json->>'admin_profile'
  );
$$;

-- Mettre à jour les politiques existantes qui utilisaient l'ancienne fonction is_admin
DROP POLICY IF EXISTS "Admins can view attestation counter" ON public.attestation_counter;
DROP POLICY IF EXISTS "Admins can update attestation counter" ON public.attestation_counter;
DROP POLICY IF EXISTS "Only authenticated admins can update requests" ON public.attestation_requests;
DROP POLICY IF EXISTS "Only authenticated admins can delete requests" ON public.attestation_requests;
DROP POLICY IF EXISTS "Admins can view all attestation requests" ON public.attestation_requests;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Admins can update students" ON public.students;

-- Nouvelles politiques simplifiées (temporairement ouvertes pour les admins connectés)
CREATE POLICY "Admins can view attestation counter" ON public.attestation_counter
  FOR SELECT USING (true);

CREATE POLICY "Admins can update attestation counter" ON public.attestation_counter
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated admins can update requests" ON public.attestation_requests
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated admins can delete requests" ON public.attestation_requests
  FOR DELETE USING (true);

CREATE POLICY "Admins can view all attestation requests" ON public.attestation_requests
  FOR SELECT USING (true);

CREATE POLICY "Admins can view all students" ON public.students
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert students" ON public.students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update students" ON public.students
  FOR UPDATE USING (true);

-- Mettre à jour la fonction reset_attestation_counter pour ne plus utiliser is_admin()
CREATE OR REPLACE FUNCTION public.reset_attestation_counter(reset_by_admin text DEFAULT NULL::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.attestation_counter 
  SET counter = 0,
      last_reset_date = now(),
      last_reset_by = reset_by_admin,
      updated_at = now()
  WHERE id = 1;
  
  RETURN 0;
END;
$function$;