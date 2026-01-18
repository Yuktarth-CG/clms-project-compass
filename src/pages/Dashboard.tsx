import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { RiskPanel } from '@/components/RiskPanel';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ViewToggle, ViewMode } from '@/components/ViewToggle';
import { StageLegend } from '@/components/StageLegend';
import { Timeline } from '@/components/Timeline';
import { StatusSummary, getProjectStatus, ProjectStatus } from '@/components/StatusSummary';
import { TeamSection } from '@/components/TeamSection';
import { AccomplishmentsSection } from '@/components/AccomplishmentsSection';
import { PipelineSection } from '@/components/PipelineSection';
import { ProjectForm } from '@/components/ProjectForm';
import { Project, ProjectCategory, STAGE_ORDER } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { useRisks } from '@/hooks/useRisks';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAccomplishments } from '@/hooks/useAccomplishments';
import { useDashboardSettings } from '@/hooks/useDashboardSettings';
import { LayoutGrid, TrendingUp, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { projects, loading: projectsLoading, updateProject, addProject } = useProjects();
  const { risks, loading: risksLoading } = useRisks();
  const { teamMembers, loading: teamLoading } = useTeamMembers();
  const { accomplishments, loading: accomplishmentsLoading } = useAccomplishments();
  const { settings } = useDashboardSettings();
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  // Separate pipeline projects (no dates) from timeline projects
  const { pipelineProjects, timelineProjects } = useMemo(() => {
    const pipeline: Project[] = [];
    const timeline: Project[] = [];
    
    projects.forEach((project) => {
      const hasAnyDate = STAGE_ORDER.some((stage) => 
        project.stages[stage].startDate || project.stages[stage].endDate
      );
      if (hasAnyDate) {
        timeline.push(project);
      } else {
        pipeline.push(project);
      }
    });
    
    return { pipelineProjects: pipeline, timelineProjects: timeline };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = timelineProjects;
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => getProjectStatus(p) === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(lowerSearch));
    }
    
    return filtered;
  }, [timelineProjects, categoryFilter, statusFilter, searchTerm]);

  const categoryCounts = useMemo(() => ({
    all: projects.length,
    content: projects.filter((p) => p.category === 'content').length,
    vanilla: projects.filter((p) => p.category === 'vanilla').length,
    enhancement: projects.filter((p) => p.category === 'enhancement').length,
  }), [projects]);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormOpen(true);
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (projectData.id) {
      await updateProject(projectData.id, projectData);
    } else {
      await addProject(projectData);
    }
    setEditingProject(null);
    setProjectFormOpen(false);
  };

  const handleStatusClick = (status: ProjectStatus) => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  const loading = projectsLoading || risksLoading || teamLoading || accomplishmentsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            Project Roadmap
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Lifecycle overview of {projects.length} CLMS projects
          </p>
        </div>

        <RiskPanel risks={risks} />

        {settings.show_team && <TeamSection teamMembers={teamMembers} />}
        {settings.show_accomplishments && <AccomplishmentsSection accomplishments={accomplishments} projects={projects} />}
        {settings.show_status_summary && (
          <StatusSummary 
            projects={projects} 
            onStatusClick={handleStatusClick}
            activeStatus={statusFilter}
          />
        )}
        
        {settings.show_pipeline && (
          <PipelineSection projects={pipelineProjects} onEditProject={handleEditProject} />
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <CategoryFilter 
              selected={categoryFilter} 
              onChange={setCategoryFilter} 
              counts={categoryCounts}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
          <StageLegend />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { count: categoryCounts.content, label: 'Content', color: 'category-content' },
            { count: categoryCounts.vanilla, label: 'Vanilla', color: 'category-vanilla' },
            { count: categoryCounts.enhancement, label: 'Enhancements', color: 'category-enhancement' },
            { count: risks.length, label: 'Active Risks', color: 'risk-high' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}/20 flex items-center justify-center`}>
                  <LayoutGrid className={`w-5 h-5 text-${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Timeline projects={filteredProjects} view={viewMode} onEditProject={handleEditProject} />
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

export default Dashboard;