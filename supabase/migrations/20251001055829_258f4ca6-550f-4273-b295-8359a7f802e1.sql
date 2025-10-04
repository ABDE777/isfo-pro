-- Ajouter une colonne pour gérer le changement de mot de passe
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Fonction pour permettre aux étudiants de changer leur mot de passe
CREATE OR REPLACE FUNCTION public.change_student_password(
  student_email TEXT,
  old_password TEXT,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record RECORD;
BEGIN
  -- Vérifier les identifiants actuels
  SELECT * INTO student_record
  FROM public.students
  WHERE email = student_email AND password_hash = old_password;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour le mot de passe
  UPDATE public.students
  SET password_hash = new_password,
      password_changed = TRUE,
      updated_at = now()
  WHERE email = student_email;
  
  RETURN TRUE;
END;
$$;

-- Ajouter une politique RLS pour permettre aux étudiants de mettre à jour leur propre mot de passe
CREATE POLICY "Students can update their own password"
ON public.students
FOR UPDATE
USING (email = auth.email() OR id = auth.uid())
WITH CHECK (email = auth.email() OR id = auth.uid());