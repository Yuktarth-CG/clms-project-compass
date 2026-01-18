-- Add jira_link column to projects table
ALTER TABLE public.projects ADD COLUMN jira_link text;

-- Add show_pipeline setting
INSERT INTO public.dashboard_settings (setting_key, setting_value)
VALUES ('show_pipeline', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Add unique constraint on setting_key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dashboard_settings_setting_key_key'
    ) THEN
        ALTER TABLE public.dashboard_settings ADD CONSTRAINT dashboard_settings_setting_key_key UNIQUE (setting_key);
    END IF;
END $$;