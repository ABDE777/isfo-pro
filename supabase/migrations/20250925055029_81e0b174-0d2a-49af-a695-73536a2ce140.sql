-- Add missing RLS policy for admin_users table
BEGIN;

-- The admin_users table has RLS enabled but no policies - add basic policy
CREATE POLICY "Admins can manage admin_users"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMIT;