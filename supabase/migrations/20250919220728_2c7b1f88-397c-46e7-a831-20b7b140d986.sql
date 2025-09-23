-- Créer une table pour stocker le compteur global des attestations
CREATE TABLE public.attestation_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER NOT NULL DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_reset_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT single_counter_row CHECK (id = 1)
);

-- Insérer la ligne unique avec le compteur initial
INSERT INTO public.attestation_counter (id, counter) VALUES (1, 0);

-- Activer RLS
ALTER TABLE public.attestation_counter ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de voir le compteur
CREATE POLICY "Admins can view attestation counter" 
ON public.attestation_counter 
FOR SELECT 
USING (is_admin());

-- Politique pour permettre aux admins de mettre à jour le compteur
CREATE POLICY "Admins can update attestation counter" 
ON public.attestation_counter 
FOR UPDATE 
USING (is_admin());

-- Fonction pour incrémenter le compteur automatiquement
CREATE OR REPLACE FUNCTION public.increment_attestation_counter()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Fonction pour réinitialiser le compteur
CREATE OR REPLACE FUNCTION public.reset_attestation_counter(reset_by_admin TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  UPDATE public.attestation_counter 
  SET counter = 0,
      last_reset_date = now(),
      last_reset_by = reset_by_admin,
      updated_at = now()
  WHERE id = 1;
  
  RETURN 0;
END;
$$;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_attestation_counter_updated_at
BEFORE UPDATE ON public.attestation_counter
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();