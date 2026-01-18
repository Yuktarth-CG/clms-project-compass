import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardSetting } from '@/types/project';
import { toast } from 'sonner';

interface DbDashboardSetting {
  id: string;
  setting_key: string;
  setting_value: boolean;
  updated_at: string;
}

const dbToSetting = (db: DbDashboardSetting): DashboardSetting => ({
  id: db.id,
  settingKey: db.setting_key,
  settingValue: db.setting_value,
  updatedAt: db.updated_at,
});

export const useDashboardSettings = () => {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    show_status_summary: true,
    show_accomplishments: true,
    show_team: false, // Changed default to false
    show_pipeline: true,
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_settings')
        .select('*');

      if (error) throw error;
      
      const settingsMap: Record<string, boolean> = {};
      (data as DbDashboardSetting[]).forEach((item) => {
        settingsMap[item.setting_key] = item.setting_value;
      });
      setSettings((prev) => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    try {
      // Try update first
      const { data: updateData, error: updateError } = await supabase
        .from('dashboard_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key)
        .select();

      // If no rows updated, insert
      if (!updateError && updateData && updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('dashboard_settings')
          .insert({ setting_key: key, setting_value: value });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      setSettings((prev) => ({ ...prev, [key]: value }));
      toast.success('Setting updated');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  return { settings, loading, updateSetting };
};