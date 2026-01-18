import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RiskItem } from '@/types/project';
import { toast } from 'sonner';

interface DbRisk {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

const dbToRisk = (db: DbRisk): RiskItem => ({
  id: db.id,
  text: db.text,
  severity: db.severity,
  createdAt: db.created_at,
});

export const useRisks = () => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRisks = async () => {
    try {
      const { data, error } = await supabase
        .from('risks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRisks((data as DbRisk[]).map(dbToRisk));
    } catch (error) {
      console.error('Error fetching risks:', error);
      toast.error('Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const addRisk = async (riskData: Omit<RiskItem, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('risks')
        .insert({ text: riskData.text, severity: riskData.severity })
        .select()
        .single();

      if (error) throw error;
      const newRisk = dbToRisk(data as DbRisk);
      setRisks((prev) => [newRisk, ...prev]);
      toast.success('Risk added');
      return newRisk;
    } catch (error) {
      console.error('Error adding risk:', error);
      toast.error('Failed to add risk');
      return null;
    }
  };

  const updateRisk = async (id: string, riskData: Omit<RiskItem, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('risks')
        .update({ text: riskData.text, severity: riskData.severity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = dbToRisk(data as DbRisk);
      setRisks((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Risk updated');
      return updated;
    } catch (error) {
      console.error('Error updating risk:', error);
      toast.error('Failed to update risk');
      return null;
    }
  };

  const deleteRisk = async (id: string) => {
    try {
      const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRisks((prev) => prev.filter((r) => r.id !== id));
      toast.success('Risk deleted');
      return true;
    } catch (error) {
      console.error('Error deleting risk:', error);
      toast.error('Failed to delete risk');
      return false;
    }
  };

  return { risks, loading, fetchRisks, addRisk, updateRisk, deleteRisk };
};
