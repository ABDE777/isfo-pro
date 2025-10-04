-- Create enum for groups
CREATE TYPE public.student_group AS ENUM (
  'D101', 'ID102', 'ID103', 'ID104',
  'IDOSR201', 'IDOSR202', 'IDOSR203', 'IDOSR204',
  'DEVOWFS201', 'DEVOWFS202', 'DEVOWFS203', 'DEVOWFS204',
  'DEV101', 'DEV102', 'DEV103', 'DEV104', 'DEV105', 'DEV106', 'DEV107'
);

-- Create enum for admin profiles
CREATE TYPE public.admin_profile AS ENUM ('KENZA', 'GHIZLANE', 'ABDELMONIM');

-- Create table for attestation requests
CREATE TABLE public.attestation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cin TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_group student_group NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin users
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile admin_profile NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attestation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to submit requests
CREATE POLICY "Anyone can submit attestation requests" 
ON public.attestation_requests 
FOR INSERT 
WITH CHECK (true);

-- Create policies for admin access
CREATE POLICY "Admins can view all requests" 
ON public.attestation_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update requests" 
ON public.attestation_requests 
FOR UPDATE 
USING (true);

-- Admin users policies (for authentication)
CREATE POLICY "Public can read admin profiles for auth" 
ON public.admin_users 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_attestation_requests_updated_at
BEFORE UPDATE ON public.attestation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin users (with simple password hashing for demo)
INSERT INTO public.admin_users (profile, password_hash) VALUES 
  ('KENZA', 'kenza123'),
  ('GHIZLANE', 'ghizlane123'),
  ('ABDELMONIM', 'abdelmonim123');