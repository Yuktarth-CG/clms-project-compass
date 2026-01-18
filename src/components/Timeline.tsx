import { useMemo, useRef, useState } from 'react';
import { Project, STAGE_ORDER, STAGE_LABELS, LifecycleStage } from '@/types/project';
import { ViewMode } from './ViewToggle';
import { Button } from '@/components/ui/button';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  eachDayOfInterval,
  differenceInDays, 
  startOfQuarter, 
  endOfQuarter, 
  addMonths,
  addQuarters,
  subMonths,
  subQuarters,
  isWithinInterval, 
  startOfDay, 
  startOfWeek,
  endOfWeek,
  isSameDay,
  getDay,
  parseISO,
  isBefore,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, AlertCircle, Clock } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import { getProjectStatus } from './StatusSummary';

interface TimelineProps {
  projects: Project[];
  view: ViewMode;
  onEditProject?: (project: Project) => void;
}

const COLUMN_WIDTH = {
  weekly: 40,
  monthly: 120,
  quarterly: 150,
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const stageColors: Record<LifecycleStage, string> = {
  requirement: 'bg-[hsl(226,70%,55%)]',
  design: 'bg-[hsl(271,81%,56%)]',
  development: 'bg-[hsl(187,92%,41%)]',
  qa: 'bg-[hsl(38,92%,50%)]',
  release: 'bg-[hsl(152,69%,41%)]',
};

interface TimeColumn {
  date: Date;
  label: string;
  subLabel?: string;
}

export const Timeline = ({ projects, view, onEditProject }: TimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAdmin = isAuthenticated();
  const today = startOfDay(new Date());
  
  // Current period state for navigation
  const [currentPeriodStart, setCurrentPeriodStart] = useState<Date>(() => {
    if (view === 'monthly') {
      return startOfMonth(today);
    } else if (view === 'quarterly') {
      return startOfQuarter(today);
    }
    return startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
  });

  // Navigate to previous/next period
  const goToPrevious = () => {
    if (view === 'monthly') {
      setCurrentPeriodStart((prev) => subMonths(prev, 1));
    } else if (view === 'quarterly') {
      setCurrentPeriodStart((prev) => subQuarters(prev, 1));
    }
  };

  const goToNext = () => {
    if (view === 'monthly') {
      setCurrentPeriodStart((prev) => addMonths(prev, 1));
    } else if (view === 'quarterly') {
      setCurrentPeriodStart((prev) => addQuarters(prev, 1));
    }
  };

  const goToToday = () => {
    if (view === 'monthly') {
      setCurrentPeriodStart(startOfMonth(today));
    } else if (view === 'quarterly') {
      setCurrentPeriodStart(startOfQuarter(today));
    }
  };

  // Calculate date range based on view and current period
  const { minDate, maxDate } = useMemo(() => {
    if (view === 'monthly') {
      return {
        minDate: startOfMonth(currentPeriodStart),
        maxDate: endOfMonth(currentPeriodStart),
      };
    } else if (view === 'quarterly') {
      return {
        minDate: startOfQuarter(currentPeriodStart),
        maxDate: endOfQuarter(currentPeriodStart),
      };
    }
    // Weekly view - show current month with week buffer
    return {
      minDate: startOfWeek(startOfMonth(currentPeriodStart), { weekStartsOn: 1 }),
      maxDate: endOfWeek(endOfMonth(currentPeriodStart), { weekStartsOn: 1 }),
    };
  }, [currentPeriodStart, view]);

  // Generate columns based on view
  const columns: TimeColumn[] = useMemo(() => {
    if (view === 'weekly') {
      const days = eachDayOfInterval({ start: minDate, end: maxDate });
      return days.map((day) => ({
        date: day,
        label: format(day, 'd'),
        subLabel: DAY_LABELS[getDay(day)],
      }));
    } else if (view === 'monthly') {
      const days = eachDayOfInterval({ start: minDate, end: maxDate });
      return days.map((day) => ({
        date: day,
        label: format(day, 'd'),
        subLabel: DAY_LABELS[getDay(day)],
      }));
    } else {
      const months = eachMonthOfInterval({ start: minDate, end: maxDate });
      return months.map((month) => ({
        date: month,
        label: format(month, 'MMM'),
        subLabel: format(month, 'yyyy'),
      }));
    }
  }, [minDate, maxDate, view]);

  // Group days by week for header rendering in weekly/monthly view
  const weekGroups = useMemo(() => {
    if (view === 'quarterly') return [];
    const weeks: { weekStart: Date; days: TimeColumn[] }[] = [];
    let currentWeek: TimeColumn[] = [];
    let currentWeekStart: Date | null = null;

    columns.forEach((col) => {
      const weekStart = startOfWeek(col.date, { weekStartsOn: 1 });
      if (!currentWeekStart || !isSameDay(currentWeekStart, weekStart)) {
        if (currentWeek.length > 0) {
          weeks.push({ weekStart: currentWeekStart!, days: currentWeek });
        }
        currentWeek = [col];
        currentWeekStart = weekStart;
      } else {
        currentWeek.push(col);
      }
    });
    if (currentWeek.length > 0) {
      weeks.push({ weekStart: currentWeekStart!, days: currentWeek });
    }
    return weeks;
  }, [columns, view]);

  const colWidth = view === 'quarterly' ? COLUMN_WIDTH.quarterly : COLUMN_WIDTH.weekly;
  const totalDays = differenceInDays(maxDate, minDate) + 1;
  const todayOffset = differenceInDays(today, minDate);
  
  const timelineWidth = columns.length * colWidth;
  const pxPerDay = timelineWidth / totalDays;

  const getStagePosition = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return null;
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const startOffset = differenceInDays(start, minDate);
    const duration = differenceInDays(end, start) + 1;
    
    const left = startOffset * pxPerDay;
    const width = Math.max(duration * pxPerDay, 8);
    
    return { left, width };
  };

  const isTodayVisible = isWithinInterval(today, { start: minDate, end: maxDate });
  const todayLeft = todayOffset * pxPerDay;

  // Get status indicators for a project
  const getStatusIndicators = (project: Project) => {
    const status = getProjectStatus(project);
    const indicators: { icon: typeof AlertCircle; label: string; className: string }[] = [];

    if (status === 'ready_for_dev') {
      indicators.push({
        icon: Clock,
        label: 'Ready for Development',
        className: 'text-[hsl(187,92%,41%)]',
      });
    }

    if (status === 'ready_for_qa') {
      indicators.push({
        icon: Clock,
        label: 'Ready for QA',
        className: 'text-[hsl(38,92%,50%)]',
      });
    }

    if (project.discarded) {
      indicators.push({
        icon: AlertCircle,
        label: 'Discarded',
        className: 'text-muted-foreground',
      });
    }

    return indicators;
  };

  const periodLabel = useMemo(() => {
    if (view === 'monthly') {
      return format(currentPeriodStart, 'MMMM yyyy');
    } else if (view === 'quarterly') {
      const quarter = Math.floor(currentPeriodStart.getMonth() / 3) + 1;
      return `Q${quarter} ${format(currentPeriodStart, 'yyyy')}`;
    }
    return format(currentPeriodStart, 'MMMM yyyy');
  }, [currentPeriodStart, view]);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
            {periodLabel}
          </span>
          <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="gap-2"
        >
          <CalendarDays className="w-4 h-4" />
          Today
        </Button>
      </div>

      {/* Scroll Container */}
      <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: `${280 + timelineWidth}px` }}>
          {/* Header */}
          {view === 'quarterly' ? (
            <div className="flex border-b border-border sticky top-0 bg-card z-20">
              <div className="w-72 flex-shrink-0 px-4 py-3 bg-secondary/50 border-r border-border sticky left-0 z-30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Project
                </span>
              </div>
              <div className="flex relative" style={{ width: timelineWidth }}>
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="border-r border-border/50 px-2 py-2 text-center flex-shrink-0 bg-secondary/30"
                    style={{ width: colWidth }}
                  >
                    <div className="text-xs font-medium text-foreground">{col.label}</div>
                    {col.subLabel && (
                      <div className="text-[10px] text-muted-foreground">{col.subLabel}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Week headers row */}
              <div className="flex border-b border-border sticky top-0 bg-card z-20">
                <div className="w-72 flex-shrink-0 px-4 py-2 bg-secondary/50 border-r border-border sticky left-0 z-30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project
                  </span>
                </div>
                <div className="flex relative">
                  {weekGroups.map((week, idx) => (
                    <div
                      key={idx}
                      className="border-r border-border bg-secondary/40 px-2 py-1 text-center"
                      style={{ width: week.days.length * colWidth }}
                    >
                      <div className="text-xs font-medium text-foreground">
                        Week of {format(week.weekStart, 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Day headers row */}
              <div className="flex border-b border-border sticky top-[36px] bg-card z-20">
                <div className="w-72 flex-shrink-0 border-r border-border bg-secondary/30 sticky left-0 z-30" />
                <div className="flex relative">
                  {columns.map((col, idx) => {
                    const isWeekend = getDay(col.date) === 0 || getDay(col.date) === 6;
                    const isToday = isSameDay(col.date, today);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'border-r border-border/50 py-1 text-center flex-shrink-0',
                          isWeekend ? 'bg-secondary/50' : 'bg-secondary/20',
                          isToday && 'bg-primary/20'
                        )}
                        style={{ width: colWidth }}
                      >
                        <div className={cn('text-[10px] text-muted-foreground', isToday && 'text-primary font-semibold')}>
                          {col.subLabel}
                        </div>
                        <div className={cn('text-xs font-medium', isToday ? 'text-primary' : 'text-foreground')}>
                          {col.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Project Rows */}
          <div className="max-h-[calc(100vh-450px)] overflow-y-auto scrollbar-thin">
            {projects.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No projects to display
              </div>
            ) : (
              projects.map((project, projectIdx) => {
                const indicators = getStatusIndicators(project);
                return (
                  <div
                    key={project.id}
                    className={cn(
                      'flex border-b border-border/50 hover:bg-secondary/20 transition-colors',
                      projectIdx % 2 === 0 ? 'bg-transparent' : 'bg-secondary/5',
                      project.discarded && 'opacity-60'
                    )}
                  >
                    {/* Project Name - Sticky */}
                    <div className="w-72 flex-shrink-0 px-4 py-3 border-r border-border/50 bg-card sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2 group">
                        <span className={`category-badge category-${project.category}`}>
                          {project.category.slice(0, 3).toUpperCase()}
                        </span>
                        {project.jiraLink ? (
                          <a
                            href={project.jiraLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "text-sm font-medium text-foreground truncate flex-1 hover:text-primary hover:underline",
                              project.discarded && "line-through"
                            )}
                            title={`${project.name} - Click to open Jira`}
                          >
                            {project.name}
                          </a>
                        ) : (
                          <span className={cn(
                            "text-sm font-medium text-foreground truncate flex-1",
                            project.discarded && "line-through"
                          )} title={project.name}>
                            {project.name}
                          </span>
                        )}
                        {indicators.map((indicator, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <indicator.icon className={cn('w-4 h-4 flex-shrink-0', indicator.className)} />
                            </TooltipTrigger>
                            <TooltipContent>{indicator.label}</TooltipContent>
                          </Tooltip>
                        ))}
                        {isAdmin && onEditProject && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                            onClick={() => onEditProject(project)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div 
                      className="relative py-2"
                      style={{ width: timelineWidth }}
                    >
                      <div className="relative h-8 flex items-center">
                        {/* Column grid lines */}
                        {columns.map((col, idx) => {
                          const isWeekend = view !== 'quarterly' && (getDay(col.date) === 0 || getDay(col.date) === 6);
                          return (
                            <div
                              key={idx}
                              className={cn(
                                'absolute top-0 bottom-0 border-r',
                                isWeekend ? 'border-border/20 bg-secondary/10' : 'border-border/10'
                              )}
                              style={{ left: idx * colWidth, width: colWidth }}
                            />
                          );
                        })}
                        
                        {/* Today marker */}
                        {isTodayVisible && todayOffset >= 0 && todayOffset <= totalDays && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                            style={{ left: todayLeft }}
                          >
                            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-primary" />
                          </div>
                        )}
                        
                        {/* Stage bars */}
                        {STAGE_ORDER.map((stage) => {
                          const position = getStagePosition(
                            project.stages[stage].startDate,
                            project.stages[stage].endDate
                          );
                          
                          if (!position) return null;
                          
                          return (
                            <Tooltip key={stage}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'absolute h-5 rounded-sm cursor-pointer transition-all hover:brightness-110 hover:h-6 shadow-sm',
                                    stageColors[stage],
                                    project.discarded && 'opacity-50'
                                  )}
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 5,
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs z-50">
                                <div className="font-semibold">{STAGE_LABELS[stage]}</div>
                                <div className="text-muted-foreground mt-1">
                                  {format(parseISO(project.stages[stage].startDate!), 'MMM d, yyyy')} 
                                  {' → '}
                                  {format(parseISO(project.stages[stage].endDate!), 'MMM d, yyyy')}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};