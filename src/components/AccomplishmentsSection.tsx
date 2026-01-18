import { Accomplishment, Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useDateFormat } from '@/contexts/DateFormatContext';

interface AccomplishmentsSectionProps {
  accomplishments: Accomplishment[];
  projects: Project[];
}

export const AccomplishmentsSection = ({ accomplishments, projects }: AccomplishmentsSectionProps) => {
  const { formatDate } = useDateFormat();

  if (accomplishments.length === 0) return null;

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.name;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-stage-release" />
          Accomplishments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accomplishments.slice(0, 5).map((item) => {
            const projectName = getProjectName(item.projectId);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div className="w-8 h-8 rounded-full bg-stage-release/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-stage-release" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.completedAt)}</span>
                    {projectName && (
                      <>
                        <span>•</span>
                        <span className="truncate">{projectName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};