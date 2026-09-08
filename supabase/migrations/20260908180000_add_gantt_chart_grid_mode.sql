-- Grid line granularity for a saved Gantt publisher chart
ALTER TABLE public.gantt_charts ADD COLUMN grid_mode TEXT NOT NULL DEFAULT 'month';

ALTER TABLE public.gantt_charts
  ADD CONSTRAINT gantt_charts_grid_mode_check CHECK (grid_mode IN ('none', 'day', 'week', 'month'));
