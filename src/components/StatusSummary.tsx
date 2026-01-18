import { Project, STAGE_LABELS, LifecycleStage, STAGE_ORDER } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAfter, isBefore, startOfDay, parseISO } from 'date-fns';

interface StatusSummaryProps {
  projects: Project[];
  onStatusClick?: (status: ProjectStatus) => void;
  activeStatus?: ProjectStatus | 'all';
}

type ProjectStatus = LifecycleStage | 'pipeline' | 'ready_for_dev' | 'ready_for_qa' | 'completed';

const getProjectStatus = (project: Project): ProjectStatus => {
  const today = startOfDay(new Date());
  
  // Discarded projects shouldn't be ready for dev or QA
  if (project.discarded) {
    // Find current stage for discarded projects
    for (const stage of [...STAGE_ORDER].reverse()) {
      if (project.stages[stage].startDate) {
        return stage;
      }
    }
    return 'pipeline';
  }
  
  // Check if it's in pipeline (no dates at all)
  const hasAnyDate = STAGE_ORDER.some((stage) => 
    project.stages[stage].startDate || project.stages[stage].endDate
  );
  if (!hasAnyDate) return 'pipeline';

  // Check if release is complete
  if (project.stages.release.endDate) {
    const releaseEnd = parseISO(project.stages.release.endDate);
    if (isBefore(releaseEnd, today) || releaseEnd.getTime() === today.getTime()) {
      return 'completed';
    }
  }

  // Check Ready for Development: design end exists but no dev start
  if (project.stages.design.endDate && !project.stages.development.startDate) {
    return 'ready_for_dev';
  }

  // Check Ready for QA: dev end before today and no QA dates
  if (project.stages.development.endDate && !project.stages.qa.startDate) {
    const devEnd = parseISO(project.stages.development.endDate);
    if (isBefore(devEnd, today)) {
      return 'ready_for_qa';
    }
  }

  // Find current active stage based on today's date
  for (const stage of [...STAGE_ORDER].reverse()) {
    const stageData = project.stages[stage];
    if (stageData.startDate) {
      const startDate = parseISO(stageData.startDate);
      if (isBefore(startDate, today) || startDate.getTime() === today.getTime()) {
        if (stageData.endDate) {
          const endDate = parseISO(stageData.endDate);
          if (isAfter(endDate, today) || endDate.getTime() === today.getTime()) {
            return stage;
          }
        } else {
          return stage;
        }
      }
    }
  }

  // Find first stage with dates
  for (const stage of STAGE_ORDER) {
    if (project.stages[stage].startDate) {
      return stage;
    }
  }

  return 'pipeline';
};

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  pipeline: { label: 'Pipeline', className: 'bg-muted text-muted-foreground' },
  requirement: { label: 'Requirements', className: 'bg-stage-requirement/20 text-[hsl(226,70%,55%)]' },
  design: { label: 'Design', className: 'bg-stage-design/20 text-[hsl(271,81%,56%)]' },
  development: { label: 'Development', className: 'bg-stage-development/20 text-[hsl(187,92%,41%)]' },
  qa: { label: 'QA', className: 'bg-stage-qa/20 text-[hsl(38,92%,50%)]' },
  release: { label: 'Release', className: 'bg-stage-release/20 text-[hsl(152,69%,41%)]' },
  ready_for_dev: { label: 'Ready for Dev', className: 'bg-stage-development/30 text-[hsl(187,92%,41%)] border border-dashed border-stage-development' },
  ready_for_qa: { label: 'Ready for QA', className: 'bg-stage-qa/30 text-[hsl(38,92%,50%)] border border-dashed border-stage-qa' },
  completed: { label: 'Completed', className: 'bg-stage-release/20 text-[hsl(152,69%,41%)]' },
};

export const StatusSummary = ({ projects, onStatusClick, activeStatus }: StatusSummaryProps) => {
  const activeProjects = projects.filter((p) => !p.discarded);
  
  const statusCounts = activeProjects.reduce<Record<ProjectStatus, number>>((acc, project) => {
    const status = getProjectStatus(project);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<ProjectStatus, number>);

  const orderedStatuses: ProjectStatus[] = ['pipeline', 'requirement', 'design', 'ready_for_dev', 'development', 'ready_for_qa', 'qa', 'release', 'completed'];
  const activeStatuses = orderedStatuses.filter((status) => statusCounts[status] > 0);

  if (activeStatuses.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Project Status Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {activeStatuses.map((status) => (
            <button
              key={status}
              onClick={() => onStatusClick?.(status)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                statusConfig[status].className,
                onStatusClick && 'cursor-pointer hover:opacity-80',
                activeStatus === status && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              {statusConfig[status].label}: {statusCounts[status]}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { getProjectStatus, type ProjectStatus };