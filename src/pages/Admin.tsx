import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';
import { Header } from '@/components/Header';
import { ProjectForm } from '@/components/ProjectForm';
import { RiskForm } from '@/components/RiskForm';
import { AccomplishmentForm } from '@/components/AccomplishmentForm';
import { TeamMemberForm } from '@/components/TeamMemberForm';
import { DateFormatSelector } from '@/components/DateFormatSelector';
import { Project, RiskItem, Accomplishment, TeamMember, CATEGORY_LABELS, STAGE_LABELS, STAGE_ORDER } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { useRisks } from '@/hooks/useRisks';
import { useAccomplishments } from '@/hooks/useAccomplishments';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDashboardSettings } from '@/hooks/useDashboardSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Trash2, AlertTriangle, FolderKanban, Loader2, Settings, Trophy, Users, XCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateFormat } from '@/contexts/DateFormatContext';

const Admin = () => {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, addProject, updateProject, deleteProject } = useProjects();
  const { risks, loading: risksLoading, addRisk, updateRisk, deleteRisk } = useRisks();
  const { accomplishments, loading: accomplishmentsLoading, addAccomplishment, updateAccomplishment, deleteAccomplishment } = useAccomplishments();
  const { teamMembers, loading: teamLoading, addTeamMember, updateTeamMember, deleteTeamMember } = useTeamMembers();
  const { settings, updateSetting } = useDashboardSettings();
  const { formatDate } = useDateFormat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [riskFormOpen, setRiskFormOpen] = useState(false);
  const [accomplishmentFormOpen, setAccomplishmentFormOpen] = useState(false);
  const [teamMemberFormOpen, setTeamMemberFormOpen] = useState(false);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [editingAccomplishment, setEditingAccomplishment] = useState<Accomplishment | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Filter projects that have any dates for the timeline tab
  const timelineProjects = useMemo(() => {
    return projects.filter((project) => {
      const hasAnyDate = STAGE_ORDER.some((stage) => 
        project.stages[stage].startDate || project.stages[stage].endDate
      );
      return hasAnyDate;
    });
  }, [projects]);

  const filteredTimelineProjects = timelineProjects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (projectData.id) {
      await updateProject(projectData.id, projectData);
    } else {
      await addProject(projectData);
    }
    setEditingProject(null);
    setProjectFormOpen(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId);
    }
  };

  const handleDiscardProject = async (project: Project) => {
    await updateProject(project.id, { ...project, discarded: !project.discarded });
  };

  const handleSaveRisk = async (riskData: Omit<RiskItem, 'id' | 'createdAt'> & { id?: string }) => {
    if (riskData.id) {
      await updateRisk(riskData.id, riskData);
    } else {
      await addRisk(riskData);
    }
    setEditingRisk(null);
    setRiskFormOpen(false);
  };

  const handleDeleteRisk = async (riskId: string) => {
    if (confirm('Are you sure you want to delete this risk?')) {
      await deleteRisk(riskId);
    }
  };

  const handleSaveAccomplishment = async (data: Omit<Accomplishment, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) {
      await updateAccomplishment(data.id, data);
    } else {
      await addAccomplishment(data);
    }
    setEditingAccomplishment(null);
    setAccomplishmentFormOpen(false);
  };

  const handleDeleteAccomplishment = async (id: string) => {
    if (confirm('Are you sure you want to delete this accomplishment?')) {
      await deleteAccomplishment(id);
    }
  };

  const handleSaveTeamMember = async (data: Omit<TeamMember, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) {
      await updateTeamMember(data.id, data);
    } else {
      await addTeamMember(data);
    }
    setEditingTeamMember(null);
    setTeamMemberFormOpen(false);
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      await deleteTeamMember(id);
    }
  };

  const loading = projectsLoading || risksLoading || accomplishmentsLoading || teamLoading;

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className={cn("hover:bg-secondary/30 transition-colors", project.discarded && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`category-badge category-${project.category}`}>
                {project.category}
              </span>
              <h3 className={cn("font-medium text-foreground truncate", project.discarded && "line-through")}>
                {project.name}
              </h3>
              {project.discarded && (
                <span className="text-xs text-muted-foreground">(Discarded)</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {STAGE_ORDER.map((stage) => {
                const hasData = project.stages[stage].startDate;
                return (
                  <span
                    key={stage}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      hasData ? 'bg-secondary' : 'bg-secondary/50 opacity-50'
                    )}
                  >
                    {STAGE_LABELS[stage]}
                    {hasData && ': ✓'}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title={project.discarded ? "Restore" : "Discard"}
              onClick={() => handleDiscardProject(project)}
            >
              <XCircle className={cn("w-4 h-4", project.discarded ? "text-muted-foreground" : "text-destructive/70")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteProject(project.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
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
            <FolderKanban className="w-6 h-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage projects, risks, accomplishments and team
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="projects">Timeline Projects ({timelineProjects.length})</TabsTrigger>
              {/* Pipeline tab removed, now a separate page */}
              <TabsTrigger value="risks">Risks ({risks.length})</TabsTrigger>
              <TabsTrigger value="accomplishments" className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Accomplishments ({accomplishments.length})
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Team ({teamMembers.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Timeline Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => { setEditingProject(null); setProjectFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>

              <div className="grid gap-3">
                {filteredTimelineProjects.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No projects with timeline dates found
                    </CardContent>
                  </Card>
                ) : (
                  filteredTimelineProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => { setEditingRisk(null); setRiskFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Risk
                </Button>
              </div>

              <div className="grid gap-3">
                {risks.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No risks registered
                    </CardContent>
                  </Card>
                ) : (
                  risks.map((risk) => (
                    <Card key={risk.id} className="hover:bg-secondary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', `text-risk-${risk.severity}`)} />
                            <div>
                              <span className={`risk-badge risk-${risk.severity} mb-2 inline-block`}>
                                {risk.severity}
                              </span>
                              <p className="text-sm text-foreground">{risk.text}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingRisk(risk); setRiskFormOpen(true); }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRisk(risk.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Accomplishments Tab */}
            <TabsContent value="accomplishments" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => { setEditingAccomplishment(null); setAccomplishmentFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Accomplishment
                </Button>
              </div>

              <div className="grid gap-3">
                {accomplishments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No accomplishments recorded
                    </CardContent>
                  </Card>
                ) : (
                  accomplishments.map((item) => {
                    const relatedProject = projects.find((p) => p.id === item.projectId);
                    return (
                      <Card key={item.id} className="hover:bg-secondary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Trophy className="w-5 h-5 mt-0.5 flex-shrink-0 text-stage-release" />
                              <div>
                                <h4 className="font-medium text-foreground">{item.title}</h4>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(item.completedAt)}</span>
                                  {relatedProject && (
                                    <>
                                      <span>•</span>
                                      <span>{relatedProject.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingAccomplishment(item); setAccomplishmentFormOpen(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAccomplishment(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => { setEditingTeamMember(null); setTeamMemberFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>

              <div className="grid gap-3">
                {teamMembers.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No team members added
                    </CardContent>
                  </Card>
                ) : (
                  teamMembers.map((member) => (
                    <Card key={member.id} className={cn("hover:bg-secondary/30 transition-colors", member.isSharedResource && "border-dashed")}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{member.name}</h4>
                                {member.isSharedResource && (
                                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">Shared</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingTeamMember(member); setTeamMemberFormOpen(true); }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTeamMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Display Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DateFormatSelector />
                  
                  <div className="border-t border-border pt-6 space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Dashboard Sections</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show_status_summary" className="cursor-pointer">Show Status Summary</Label>
                      <Switch
                        id="show_status_summary"
                        checked={settings.show_status_summary}
                        onCheckedChange={(v) => updateSetting('show_status_summary', v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show_pipeline" className="cursor-pointer">Show Pipeline Section</Label>
                      <Switch
                        id="show_pipeline"
                        checked={settings.show_pipeline ?? true}
                        onCheckedChange={(v) => updateSetting('show_pipeline', v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show_accomplishments" className="cursor-pointer">Show Accomplishments</Label>
                      <Switch
                        id="show_accomplishments"
                        checked={settings.show_accomplishments}
                        onCheckedChange={(v) => updateSetting('show_accomplishments', v)}
                      />
                    </div>
                    {/* Removed 'Show Team Section' toggle from Admin */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <ProjectForm
        project={editingProject}
        open={projectFormOpen}
        onClose={() => { setProjectFormOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
      />

      <RiskForm
        risk={editingRisk}
        open={riskFormOpen}
        onClose={() => { setRiskFormOpen(false); setEditingRisk(null); }}
        onSave={handleSaveRisk}
      />

      <AccomplishmentForm
        accomplishment={editingAccomplishment}
        projects={projects}
        open={accomplishmentFormOpen}
        onClose={() => { setAccomplishmentFormOpen(false); setEditingAccomplishment(null); }}
        onSave={handleSaveAccomplishment}
      />

      <TeamMemberForm
        member={editingTeamMember}
        open={teamMemberFormOpen}
        onClose={() => { setTeamMemberFormOpen(false); setEditingTeamMember(null); }}
        onSave={handleSaveTeamMember}
        nextOrder={teamMembers.length}
      />
    </div>
  );
};

export default Admin;