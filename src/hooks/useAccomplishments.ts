import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accomplishment } from '@/types/project';
import { toast } from 'sonner';

interface DbAccomplishment {
  id: string;
  title: string;
  description: string | null;
  completed_at: string;
  project_id: string | null;
  created_at: string;
}

const dbToAccomplishment = (db: DbAccomplishment): Accomplishment => ({
  id: db.id,
  title: db.title,
  description: db.description,
  completedAt: db.completed_at,
  projectId: db.project_id,
  createdAt: db.created_at,
});

export const useAccomplishments = () => {
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccomplishments = async () => {
    try {
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setAccomplishments((data as DbAccomplishment[]).map(dbToAccomplishment));
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
      toast.error('Failed to load accomplishments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccomplishments();
  }, []);

  const addAccomplishment = async (data: Omit<Accomplishment, 'id' | 'createdAt'>) => {
    try {
      const { data: result, error } = await supabase
        .from('accomplishments')
        .insert({
          title: data.title,
          description: data.description,
          completed_at: data.completedAt,
          project_id: data.projectId,
        })
        .select()
        .single();

      if (error) throw error;
      const newItem = dbToAccomplishment(result as DbAccomplishment);
      setAccomplishments((prev) => [newItem, ...prev]);
      toast.success('Accomplishment added');
      return newItem;
    } catch (error) {
      console.error('Error adding accomplishment:', error);
      toast.error('Failed to add accomplishment');
      return null;
    }
  };

  const updateAccomplishment = async (id: string, data: Partial<Omit<Accomplishment, 'id' | 'createdAt'>>) => {
    try {
      const updateObj: Record<string, unknown> = {};
      if (data.title !== undefined) updateObj.title = data.title;
      if (data.description !== undefined) updateObj.description = data.description;
      if (data.completedAt !== undefined) updateObj.completed_at = data.completedAt;
      if (data.projectId !== undefined) updateObj.project_id = data.projectId;

      const { data: result, error } = await supabase
        .from('accomplishments')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = dbToAccomplishment(result as DbAccomplishment);
      setAccomplishments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success('Accomplishment updated');
      return updated;
    } catch (error) {
      console.error('Error updating accomplishment:', error);
      toast.error('Failed to update accomplishment');
      return null;
    }
  };

  const deleteAccomplishment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accomplishments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAccomplishments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Accomplishment deleted');
      return true;
    } catch (error) {
      console.error('Error deleting accomplishment:', error);
      toast.error('Failed to delete accomplishment');
      return false;
    }
  };

  return { accomplishments, loading, fetchAccomplishments, addAccomplishment, updateAccomplishment, deleteAccomplishment };
};