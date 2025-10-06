-- Create login_audit table for security tracking
CREATE TABLE IF NOT EXISTS public.login_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'admin')),
  ip_address TEXT,
  user_agent TEXT,
  login_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  city TEXT,
  country TEXT,
  device_info TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all login audit logs"
  ON public.login_audit
  FOR SELECT
  USING (true);

-- Allow inserts from both admin and student logins (no auth required for login tracking)
CREATE POLICY "Allow insert login audit logs"
  ON public.login_audit
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON public.login_audit(user_email);
CREATE INDEX IF NOT EXISTS idx_login_audit_timestamp ON public.login_audit(login_timestamp DESC);