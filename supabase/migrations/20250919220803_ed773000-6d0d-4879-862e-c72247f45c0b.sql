-- Activer RLS sur les tables manquantes détectées par le linter
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create is_admin function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If no user_id provided, check the current authenticated user
  IF user_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.admin_users 
      WHERE id = auth.uid()
    );
  ELSE
    -- Check specific user_id
    RETURN EXISTS (
      SELECT 1 
      FROM public.admin_users 
      WHERE id = user_id
    );
  END IF;
END;
$$;

-- Corriger les fonctions en ajoutant search_path
CREATE OR REPLACE FUNCTION public.increment_attestation_counter()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  UPDATE public.attestation_counter 
  SET counter = counter + 1, 
      updated_at = now()
  WHERE id = 1
  RETURNING counter INTO new_counter;
  
  RETURN new_counter;
END;
$$;