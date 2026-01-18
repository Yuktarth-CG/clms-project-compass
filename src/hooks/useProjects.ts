import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, LifecycleStage, STAGE_ORDER } from '@/types/project';
import { toast } from 'sonner';

interface DbProject {
  id: string;
  name: string;
  category: 'content' | 'vanilla' | 'enhancement';
  requirement_start_date: string | null;
  requirement_end_date: string | null;
  design_start_date: string | null;
  design_end_date: string | null;
  development_start_date: string | null;
  development_end_date: string | null;
  qa_start_date: string | null;
  qa_end_date: string | null;
  release_start_date: string | null;
  release_end_date: string | null;
  discarded: boolean;
  jira_link: string | null;
  created_at: string;
  updated_at: string;
}

const dbToProject = (db: DbProject): Project => ({
  id: db.id,
  name: db.name,
  category: db.category,
  stages: {
    requirement: { startDate: db.requirement_start_date, endDate: db.requirement_end_date },
    design: { startDate: db.design_start_date, endDate: db.design_end_date },
    development: { startDate: db.development_start_date, endDate: db.development_end_date },
    qa: { startDate: db.qa_start_date, endDate: db.qa_end_date },
    release: { startDate: db.release_start_date, endDate: db.release_end_date },
  },
  discarded: db.discarded,
  jiraLink: db.jira_link,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const projectToDb = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => ({
  name: project.name,
  category: project.category,
  requirement_start_date: project.stages.requirement.startDate,
  requirement_end_date: project.stages.requirement.endDate,
  design_start_date: project.stages.design.startDate,
  design_end_date: project.stages.design.endDate,
  development_start_date: project.stages.development.startDate,
  development_end_date: project.stages.development.endDate,
  qa_start_date: project.stages.qa.startDate,
  qa_end_date: project.stages.qa.endDate,
  release_start_date: project.stages.release.startDate,
  release_end_date: project.stages.release.endDate,
  discarded: project.discarded,
  jira_link: project.jiraLink,
});

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects((data as DbProject[]).map(dbToProject));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectToDb(projectData))
        .select()
        .single();

      if (error) throw error;
      const newProject = dbToProject(data as DbProject);
      setProjects((prev) => [...prev, newProject]);
      toast.success('Project added');
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
      return null;
    }
  };

  const updateProject = async (id: string, projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(projectToDb(projectData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = dbToProject(data as DbProject);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Project updated');
      return updated;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted');
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  };

  return { projects, loading, fetchProjects, addProject, updateProject, deleteProject };
};