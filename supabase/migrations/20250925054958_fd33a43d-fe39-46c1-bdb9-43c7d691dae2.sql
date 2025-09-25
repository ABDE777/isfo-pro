-- Add missing policy for admin_users table to resolve security warnings
BEGIN;

-- Add policy for admin_users table to allow only admin operations
CREATE POLICY "Only system admin operations allowed" 
ON public.admin_users 
FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- Grant public read access to admin_users if needed for custom auth
-- (This is already the default but making it explicit)

COMMIT;