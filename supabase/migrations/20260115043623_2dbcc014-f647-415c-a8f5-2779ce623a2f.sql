-- Create enum types for project category and lifecycle stage
CREATE TYPE public.project_category AS ENUM ('content', 'vanilla', 'enhancement');
CREATE TYPE public.lifecycle_stage AS ENUM ('requirement', 'design', 'development', 'qa', 'release');
CREATE TYPE public.risk_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category project_category NOT NULL DEFAULT 'content',
  requirement_start_date DATE,
  requirement_end_date DATE,
  design_start_date DATE,
  design_end_date DATE,
  development_start_date DATE,
  development_end_date DATE,
  qa_start_date DATE,
  qa_end_date DATE,
  release_start_date DATE,
  release_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risks table
CREATE TABLE public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  severity risk_severity NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for single-user app)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (single-user utility)
CREATE POLICY "Allow public read access on projects" 
  ON public.projects FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access on projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access on projects" 
  ON public.projects FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access on projects" 
  ON public.projects FOR DELETE 
  USING (true);

CREATE POLICY "Allow public read access on risks" 
  ON public.risks FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access on risks" 
  ON public.risks FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access on risks" 
  ON public.risks FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access on risks" 
  ON public.risks FOR DELETE 
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();