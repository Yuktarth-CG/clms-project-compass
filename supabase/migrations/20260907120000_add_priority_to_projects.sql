-- Add priority tier to projects (1 = highest priority, 4 = lowest)
ALTER TABLE public.projects ADD COLUMN priority integer;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_priority_range CHECK (priority IS NULL OR priority BETWEEN 1 AND 4);
