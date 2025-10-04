-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.change_student_password(text, text, text);

-- Ajouter les colonnes pour le compteur de changement de mot de passe
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS password_changes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS password_changes_year INTEGER DEFAULT EXTRACT(YEAR FROM now());

-- Ajouter la colonne pour le numéro d'attestation fixe
ALTER TABLE public.attestation_requests
ADD COLUMN IF NOT EXISTS attestation_number INTEGER;

-- Fonction pour gérer le changement de mot de passe (limite de 3 par an)
CREATE OR REPLACE FUNCTION public.change_student_password(
  student_email text,
  old_password text,
  new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record RECORD;
  current_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM now());
  
  -- Vérifier les identifiants actuels
  SELECT * INTO student_record
  FROM public.students
  WHERE email = student_email AND password_hash = old_password;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mot de passe actuel incorrect');
  END IF;
  
  -- Réinitialiser le compteur si on est dans une nouvelle année
  IF student_record.password_changes_year < current_year THEN
    UPDATE public.students
    SET password_changes_count = 0,
        password_changes_year = current_year
    WHERE email = student_email;
    student_record.password_changes_count := 0;
  END IF;
  
  -- Vérifier la limite de 3 changements par an
  IF student_record.password_changes_count >= 3 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Limite de changements de mot de passe atteinte (3 par an)',
      'remaining', 0
    );
  END IF;
  
  -- Mettre à jour le mot de passe et incrémenter le compteur
  UPDATE public.students
  SET password_hash = new_password,
      password_changed = TRUE,
      password_changes_count = password_changes_count + 1,
      updated_at = now()
  WHERE email = student_email;
  
  RETURN json_build_object(
    'success', true, 
    'remaining', 2 - student_record.password_changes_count
  );
END;
$$;

-- Fonction pour que l'admin puisse modifier le compteur de changement de mot de passe
CREATE OR REPLACE FUNCTION public.admin_update_password_changes_counter(
  student_email text,
  new_count integer,
  new_year integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET password_changes_count = new_count,
      password_changes_year = COALESCE(new_year, password_changes_year),
      updated_at = now()
  WHERE email = student_email;
  
  RETURN FOUND;
END;
$$;

-- Fonction pour que l'admin puisse modifier le compteur d'attestations
CREATE OR REPLACE FUNCTION public.admin_update_attestation_counter(
  new_counter_value integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.attestation_counter
  SET counter = new_counter_value,
      updated_at = now()
  WHERE id = 1;
  
  RETURN FOUND;
END;
$$;

-- Trigger pour assigner automatiquement un numéro d'attestation UNIQUEMENT lors de l'approbation
CREATE OR REPLACE FUNCTION public.assign_attestation_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  -- Si le statut passe à "approved" ET qu'il n'y a pas encore de numéro d'attestation
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.attestation_number IS NULL THEN
    -- Incrémenter le compteur
    UPDATE public.attestation_counter 
    SET counter = counter + 1, 
        updated_at = now()
    WHERE id = 1
    RETURNING counter INTO new_counter;
    
    -- Assigner le numéro à la demande
    NEW.attestation_number := new_counter;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_assign_attestation_number ON public.attestation_requests;
CREATE TRIGGER trigger_assign_attestation_number
  BEFORE UPDATE ON public.attestation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_attestation_number();