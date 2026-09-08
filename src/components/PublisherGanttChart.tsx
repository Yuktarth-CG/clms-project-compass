import { forwardRef, useMemo } from 'react';
import { Project, STAGE_ORDER, STAGE_LABELS, LifecycleStage } from '@/types/project';
import {
  format,
  differenceInDays,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  max as maxDate,
  min as minDate,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface PublisherGanttChartProps {
  title: string;
  subtitle?: string;
  projects: Project[];
  rangeStart: Date;
  rangeEnd: Date;
}

const NAME_COL_WIDTH = 340;
const CHART_WIDTH = 760;
const MIN_ROW_HEIGHT = 40;

const stageColors: Record<LifecycleStage, string> = {
  requirement: '#4f6bed',
  design: '#a855f7',
  development: '#06b6d4',
  qa: '#f59e0b',
  release: '#22c55e',
};

const categoryColors: Record<Project['category'], string> = {
  content: '#38bdf8',
  vanilla: '#a78bfa',
  enhancement: '#4ade80',
};

export const PublisherGanttChart = forwardRef<HTMLDivElement, PublisherGanttChartProps>(
  ({ title, subtitle, projects, rangeStart, rangeEnd }, ref) => {
    const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart) + 1, 1);
    const pxPerDay = CHART_WIDTH / totalDays;

    const months = useMemo(() => {
      const list = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
      return list.map((m) => {
        const segStart = maxDate([startOfMonth(m), rangeStart]);
        const segEnd = minDate([endOfMonth(m), rangeEnd]);
        const left = differenceInDays(segStart, rangeStart) * pxPerDay;
        const width = (differenceInDays(segEnd, segStart) + 1) * pxPerDay;
        return { label: format(m, 'MMMM yyyy'), left, width };
      });
    }, [rangeStart, rangeEnd, pxPerDay]);

    const getBarStyle = (startStr: string | null, endStr: string | null) => {
      if (!startStr || !endStr) return null;
      const s = maxDate([parseISO(startStr), rangeStart]);
      const e = minDate([parseISO(endStr), rangeEnd]);
      if (differenceInDays(e, s) < 0) return null;
      const left = differenceInDays(s, rangeStart) * pxPerDay;
      const width = Math.max((differenceInDays(e, s) + 1) * pxPerDay, 3);
      return { left, width };
    };

    return (
      <div
        ref={ref}
        style={{ width: NAME_COL_WIDTH + CHART_WIDTH + 32, fontFamily: 'system-ui, -apple-system, sans-serif' }}
        className="bg-white text-slate-900 p-4"
      >
        <div className="mb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden">
          {/* Month header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div style={{ width: NAME_COL_WIDTH }} className="flex-shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-r border-slate-200">
              Project
            </div>
            <div className="relative" style={{ width: CHART_WIDTH, height: 28 }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-medium text-slate-600 border-r border-slate-200"
                  style={{ left: m.left, width: m.width }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {projects.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-slate-400">No projects selected</div>
          ) : (
            projects.map((project, idx) => (
              <div
                key={project.id}
                className={cn('flex items-stretch border-b border-slate-100 last:border-b-0', idx % 2 === 1 && 'bg-slate-50/60')}
                style={{ minHeight: MIN_ROW_HEIGHT }}
              >
                <div
                  style={{ width: NAME_COL_WIDTH }}
                  className="flex-shrink-0 px-3 py-2 flex items-center gap-2 border-r border-slate-200 min-w-0"
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white flex-shrink-0 self-start mt-0.5"
                    style={{ backgroundColor: categoryColors[project.category] }}
                  >
                    {project.category.slice(0, 3).toUpperCase()}
                  </span>
                  {project.priority && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 flex-shrink-0 self-start mt-0.5">
                      P{project.priority}
                    </span>
                  )}
                  <span className={cn('text-xs font-medium leading-snug whitespace-normal break-words', project.discarded && 'line-through text-slate-400')}>
                    {project.name}
                  </span>
                </div>
                <div style={{ width: CHART_WIDTH, minHeight: MIN_ROW_HEIGHT }} className="relative flex-shrink-0">
                  {months.map((m, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-r border-slate-100" style={{ left: m.left, width: m.width }} />
                  ))}
                  {STAGE_ORDER.map((stage) => {
                    const bar = getBarStyle(project.stages[stage].startDate, project.stages[stage].endDate);
                    if (!bar) return null;
                    return (
                      <div
                        key={stage}
                        title={`${STAGE_LABELS[stage]}: ${project.stages[stage].startDate} → ${project.stages[stage].endDate}`}
                        className="absolute rounded-sm"
                        style={{
                          left: bar.left,
                          width: bar.width,
                          top: '50%',
                          marginTop: -7,
                          height: 14,
                          backgroundColor: stageColors[stage],
                          opacity: project.discarded ? 0.4 : 1,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: stageColors[stage] }} />
              <span className="text-[11px] text-slate-600">{STAGE_LABELS[stage]}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 mt-3">
          Generated {format(new Date(), 'MMM d, yyyy')} · CLMS Planner
        </p>
      </div>
    );
  }
);

PublisherGanttChart.displayName = 'PublisherGanttChart';
