-- Toggle for showing/hiding the category (project type) badge in a saved Gantt chart
ALTER TABLE public.gantt_charts ADD COLUMN show_category BOOLEAN NOT NULL DEFAULT false;
