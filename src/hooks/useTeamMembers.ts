import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/project';
import { toast } from 'sonner';

interface DbTeamMember {
  id: string;
  name: string;
  role: string;
  is_shared_resource: boolean;
  display_order: number;
  created_at: string;
}

const dbToTeamMember = (db: DbTeamMember): TeamMember => ({
  id: db.id,
  name: db.name,
  role: db.role,
  isSharedResource: db.is_shared_resource,
  displayOrder: db.display_order,
  createdAt: db.created_at,
});

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTeamMembers((data as DbTeamMember[]).map(dbToTeamMember));
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const addTeamMember = async (memberData: Omit<TeamMember, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          name: memberData.name,
          role: memberData.role,
          is_shared_resource: memberData.isSharedResource,
          display_order: memberData.displayOrder,
        })
        .select()
        .single();

      if (error) throw error;
      const newMember = dbToTeamMember(data as DbTeamMember);
      setTeamMembers((prev) => [...prev, newMember].sort((a, b) => a.displayOrder - b.displayOrder));
      toast.success('Team member added');
      return newMember;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
      return null;
    }
  };

  const updateTeamMember = async (id: string, memberData: Partial<Omit<TeamMember, 'id' | 'createdAt'>>) => {
    try {
      const updateObj: Record<string, unknown> = {};
      if (memberData.name !== undefined) updateObj.name = memberData.name;
      if (memberData.role !== undefined) updateObj.role = memberData.role;
      if (memberData.isSharedResource !== undefined) updateObj.is_shared_resource = memberData.isSharedResource;
      if (memberData.displayOrder !== undefined) updateObj.display_order = memberData.displayOrder;

      const { data, error } = await supabase
        .from('team_members')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = dbToTeamMember(data as DbTeamMember);
      setTeamMembers((prev) => prev.map((m) => (m.id === id ? updated : m)).sort((a, b) => a.displayOrder - b.displayOrder));
      toast.success('Team member updated');
      return updated;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success('Team member removed');
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to remove team member');
      return false;
    }
  };

  return { teamMembers, loading, fetchTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember };
};