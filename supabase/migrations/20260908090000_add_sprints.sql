-- Create sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on sprints"
  ON public.sprints FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on sprints"
  ON public.sprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on sprints"
  ON public.sprints FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on sprints"
  ON public.sprints FOR DELETE
  USING (true);

-- Link projects (stories) to a sprint
ALTER TABLE public.projects ADD COLUMN sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;
