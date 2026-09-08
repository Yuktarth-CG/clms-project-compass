import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SavedGanttChart, GanttGridMode, LifecycleStage, StageDate } from '@/types/project';
import type { Json } from '@/integrations/supabase/types';
import { withRetry } from '@/lib/retry';
import { toast } from 'sonner';

interface DbGanttChart {
  id: string;
  name: string;
  title: string;
  subtitle: string | null;
  range_start: string | null;
  range_end: string | null;
  project_ids: string[];
  overrides: Record<string, Record<LifecycleStage, StageDate>>;
  grid_mode: GanttGridMode;
  show_category: boolean;
  created_at: string;
  updated_at: string;
}

const dbToChart = (db: DbGanttChart): SavedGanttChart => ({
  id: db.id,
  name: db.name,
  title: db.title,
  subtitle: db.subtitle,
  rangeStart: db.range_start,
  rangeEnd: db.range_end,
  projectIds: db.project_ids,
  overrides: db.overrides,
  gridMode: db.grid_mode,
  showCategory: db.show_category,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const useGanttCharts = () => {
  const [charts, setCharts] = useState<SavedGanttChart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCharts = async () => {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase.from('gantt_charts').select('*').order('updated_at', { ascending: false });
      });
      if (error) throw error;
      setCharts((data as unknown as DbGanttChart[]).map(dbToChart));
    } catch (error) {
      console.error('Error fetching gantt charts:', error);
      toast.error('Failed to load saved charts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const saveChart = async (chart: Omit<SavedGanttChart, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('gantt_charts')
        .insert({
          name: chart.name,
          title: chart.title,
          subtitle: chart.subtitle,
          range_start: chart.rangeStart,
          range_end: chart.rangeEnd,
          project_ids: chart.projectIds,
          overrides: chart.overrides as unknown as Json,
          grid_mode: chart.gridMode,
          show_category: chart.showCategory,
        })
        .select()
        .single();
      if (error) throw error;
      const created = dbToChart(data as unknown as DbGanttChart);
      setCharts((prev) => [created, ...prev]);
      toast.success('Chart saved');
      return created;
    } catch (error) {
      console.error('Error saving gantt chart:', error);
      toast.error('Failed to save chart');
      return null;
    }
  };

  const updateChart = async (id: string, chart: Omit<SavedGanttChart, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('gantt_charts')
        .update({
          name: chart.name,
          title: chart.title,
          subtitle: chart.subtitle,
          range_start: chart.rangeStart,
          range_end: chart.rangeEnd,
          project_ids: chart.projectIds,
          overrides: chart.overrides as unknown as Json,
          grid_mode: chart.gridMode,
          show_category: chart.showCategory,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const updated = dbToChart(data as unknown as DbGanttChart);
      setCharts((prev) => prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      toast.success('Chart updated');
      return updated;
    } catch (error) {
      console.error('Error updating gantt chart:', error);
      toast.error('Failed to update chart');
      return null;
    }
  };

  const deleteChart = async (id: string) => {
    try {
      const { error } = await supabase.from('gantt_charts').delete().eq('id', id);
      if (error) throw error;
      setCharts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Chart deleted');
      return true;
    } catch (error) {
      console.error('Error deleting gantt chart:', error);
      toast.error('Failed to delete chart');
      return false;
    }
  };

  return { charts, loading, fetchCharts, saveChart, updateChart, deleteChart };
};
