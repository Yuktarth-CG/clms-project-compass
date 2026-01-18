import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '@/lib/auth';

interface PipelineSectionProps {
  projects: Project[];
  onEditProject?: (project: Project) => void;
}

export const PipelineSection = ({ projects, onEditProject }: PipelineSectionProps) => {
  const isAdmin = isAuthenticated();

  if (projects.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="w-5 h-5 text-muted-foreground" />
          Product Pipeline
          <span className="text-xs font-normal text-muted-foreground ml-1">
            ({projects.length} projects awaiting dates)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border"
            >
              <span className={`category-badge category-${project.category}`}>
                {project.category.slice(0, 3).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-foreground">{project.name}</span>
              {isAdmin && onEditProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => onEditProject(project)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};