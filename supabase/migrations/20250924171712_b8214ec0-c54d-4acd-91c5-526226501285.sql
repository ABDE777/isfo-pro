-- Suppression des tables non utilisées dans l'application
-- Ces tables ont été identifiées comme non utilisées dans le code

-- Supprimer la table admin_alerts (utilisée uniquement dans les types mais pas dans le code)
DROP TABLE IF EXISTS public.admin_alerts CASCADE;

-- Supprimer la table verification_codes (utilisée uniquement dans les types mais pas dans le code)
DROP TABLE IF EXISTS public.verification_codes CASCADE;

-- Supprimer la table admin_users (remplacée par admin_profiles pour l'authentification)
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Supprimer les fonctions d'envoi d'email qui ne sont plus utilisées
DROP FUNCTION IF EXISTS public.send_notification CASCADE;