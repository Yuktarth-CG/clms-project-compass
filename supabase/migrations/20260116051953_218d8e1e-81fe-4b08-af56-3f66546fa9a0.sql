-- Add discarded flag to projects table
ALTER TABLE public.projects 
ADD COLUMN discarded boolean NOT NULL DEFAULT false;

-- Create accomplishments table
CREATE TABLE public.accomplishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on accomplishments
ALTER TABLE public.accomplishments ENABLE ROW LEVEL SECURITY;

-- Create public access policies for accomplishments (same as projects)
CREATE POLICY "Allow public read access on accomplishments" 
ON public.accomplishments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on accomplishments" 
ON public.accomplishments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access on accomplishments" 
ON public.accomplishments 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access on accomplishments" 
ON public.accomplishments 
FOR DELETE 
USING (true);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_shared_resource BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create public access policies for team_members
CREATE POLICY "Allow public read access on team_members" 
ON public.team_members 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on team_members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access on team_members" 
ON public.team_members 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access on team_members" 
ON public.team_members 
FOR DELETE 
USING (true);

-- Create dashboard_settings table for toggles
CREATE TABLE public.dashboard_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on dashboard_settings
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create public access policies for dashboard_settings
CREATE POLICY "Allow public read access on dashboard_settings" 
ON public.dashboard_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on dashboard_settings" 
ON public.dashboard_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access on dashboard_settings" 
ON public.dashboard_settings 
FOR UPDATE 
USING (true);

-- Insert default settings
INSERT INTO public.dashboard_settings (setting_key, setting_value) VALUES 
  ('show_status_summary', true),
  ('show_accomplishments', true),
  ('show_team', true);

-- Insert initial team members
INSERT INTO public.team_members (name, role, is_shared_resource, display_order) VALUES 
  ('Mansi', 'Tech Lead', false, 1),
  ('Om', 'Backend', false, 2),
  ('Harsh', 'Frontend', false, 3),
  ('Nitish', 'Design', true, 4),
  ('Rahul', 'QA', false, 5),
  ('Shresth', 'QA Intern', false, 6),
  ('Yuktarth', 'Product', false, 7);