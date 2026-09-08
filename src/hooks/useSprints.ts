import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sprint } from '@/types/project';
import { withRetry } from '@/lib/retry';
import { toast } from 'sonner';

interface DbSprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

const dbToSprint = (db: DbSprint): Sprint => ({
  id: db.id,
  name: db.name,
  startDate: db.start_date,
  endDate: db.end_date,
  createdAt: db.created_at,
});

export const useSprints = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSprints = async () => {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('sprints')
          .select('*')
          .order('start_date');
      });

      if (error) throw error;
      setSprints((data as DbSprint[]).map(dbToSprint));
    } catch (error) {
      console.error('Error fetching sprints:', error);
      toast.error('Failed to load sprints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprints();
  }, []);

  const addSprint = async (sprintData: Omit<Sprint, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .insert({
          name: sprintData.name,
          start_date: sprintData.startDate,
          end_date: sprintData.endDate,
        })
        .select()
        .single();

      if (error) throw error;
      const newSprint = dbToSprint(data as DbSprint);
      setSprints((prev) => [...prev, newSprint].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      toast.success('Sprint added');
      return newSprint;
    } catch (error) {
      console.error('Error adding sprint:', error);
      toast.error('Failed to add sprint');
      return null;
    }
  };

  const updateSprint = async (id: string, sprintData: Partial<Omit<Sprint, 'id' | 'createdAt'>>) => {
    try {
      const updateObj: Record<string, unknown> = {};
      if (sprintData.name !== undefined) updateObj.name = sprintData.name;
      if (sprintData.startDate !== undefined) updateObj.start_date = sprintData.startDate;
      if (sprintData.endDate !== undefined) updateObj.end_date = sprintData.endDate;

      const { data, error } = await supabase
        .from('sprints')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = dbToSprint(data as DbSprint);
      setSprints((prev) => prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.startDate.localeCompare(b.startDate)));
      toast.success('Sprint updated');
      return updated;
    } catch (error) {
      console.error('Error updating sprint:', error);
      toast.error('Failed to update sprint');
      return null;
    }
  };

  const deleteSprint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSprints((prev) => prev.filter((s) => s.id !== id));
      toast.success('Sprint deleted');
      return true;
    } catch (error) {
      console.error('Error deleting sprint:', error);
      toast.error('Failed to delete sprint');
      return false;
    }
  };

  return { sprints, loading, fetchSprints, addSprint, updateSprint, deleteSprint };
};
