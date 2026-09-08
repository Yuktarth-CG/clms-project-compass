-- Saved Gantt Publisher charts, so a hand-picked selection + local date
-- overrides can be reloaded for re-editing instead of re-entered each time.
CREATE TABLE public.gantt_charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  range_start DATE,
  range_end DATE,
  project_ids TEXT[] NOT NULL DEFAULT '{}',
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gantt_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on gantt_charts"
  ON public.gantt_charts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on gantt_charts"
  ON public.gantt_charts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on gantt_charts"
  ON public.gantt_charts FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on gantt_charts"
  ON public.gantt_charts FOR DELETE
  USING (true);

CREATE TRIGGER update_gantt_charts_updated_at
  BEFORE UPDATE ON public.gantt_charts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
