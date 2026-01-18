import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';
import { Header } from '@/components/Header';
import { ProjectForm } from '@/components/ProjectForm';
import { Project, STAGE_ORDER, CATEGORY_LABELS } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Pencil, Inbox, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const PipelinePage = () => {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, addProject, updateProject } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const pipelineProjects = useMemo(() => {
    return projects.filter((project) => {
      const hasAnyDate = STAGE_ORDER.some((stage) => 
        project.stages[stage].startDate || project.stages[stage].endDate
      );
      return !hasAnyDate;
    });
  }, [projects]);

  const filteredPipelineProjects = useMemo(() => {
    return pipelineProjects.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pipelineProjects, searchTerm]);

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (projectData.id) {
      await updateProject(projectData.id, projectData);
    } else {
      await addProject(projectData);
    }
    setEditingProject(null);
    setProjectFormOpen(false);
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:bg-secondary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`category-badge category-${project.category}`}>
                {CATEGORY_LABELS[project.category]}
              </span>
              <h3 className="font-medium text-foreground truncate">
                {project.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This project is in the pipeline and awaiting initial lifecycle dates.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}
              title="Add dates to timeline"
            >
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Inbox className="w-6 h-6 text-muted-foreground" />
            Product Pipeline
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Projects awaiting initial lifecycle dates to be added to the roadmap.
          </p>
        </div>

        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pipeline projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => { setEditingProject(null); setProjectFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Project
              </Button>
            </div>

            <div className="grid gap-3">
              {filteredPipelineProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No projects currently in the pipeline.
                  </CardContent>
                </Card>
              ) : (
                filteredPipelineProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <ProjectForm
        project={editingProject}
        open={projectFormOpen}
        onClose={() => { setProjectFormOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
      />
    </div>
  );
};

export default PipelinePage;