import { forwardRef, useMemo } from 'react';
import { Project, STAGE_ORDER, STAGE_LABELS, LifecycleStage, GanttGridMode } from '@/types/project';
import {
  format,
  differenceInDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  max as maxDate,
  min as minDate,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { GripVertical, Pencil, X } from 'lucide-react';

interface PublisherGanttChartProps {
  title: string;
  subtitle?: string;
  projects: Project[];
  rangeStart: Date;
  rangeEnd: Date;
  gridMode: GanttGridMode;
  showCategory: boolean;
  /** When true, rows become draggable and show edit/remove controls in the
   * name column. All interactive-only elements are tagged
   * data-html2canvas-ignore so they're excluded from PNG/PDF export. */
  interactive?: boolean;
  draggedId?: string | null;
  dragOverId?: string | null;
  onDragStartRow?: (id: string) => void;
  onDragOverRow?: (e: React.DragEvent, id: string) => void;
  onDropRow?: (id: string) => void;
  onDragEndRow?: () => void;
  onEditRow?: (id: string) => void;
  onRemoveRow?: (id: string) => void;
}

const NAME_COL_WIDTH = 340;
const MIN_ROW_HEIGHT = 40;

// Each view mode is both a zoom level (pixels per day) and a grid granularity —
// like switching a calendar between Month/Week/Day view.
const PX_PER_DAY: Record<GanttGridMode, number> = {
  none: 9,
  month: 9,
  week: 24,
  day: 48,
};

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

// Projects tagged against the original commitment doc carry a "Bet Bx ... Dy"
// fragment in their reason field (e.g. "Bet B3 (The Content Library) D1 ·
// Green ..."). Pull just the bet/deliverable numbers out of it for display.
const BET_TAG_REGEX = /Bet\s+B(\d+)(?:\s*\([^)]*\))?\s*D(\d+)/i;

const getBetTag = (reason: string | null): string | null => {
  if (!reason) return null;
  const match = reason.match(BET_TAG_REGEX);
  return match ? `B${match[1]}:D${match[2]}` : null;
};

export const PublisherGanttChart = forwardRef<HTMLDivElement, PublisherGanttChartProps>(
  (
    {
      title,
      subtitle,
      projects,
      rangeStart,
      rangeEnd,
      gridMode,
      showCategory,
      interactive = false,
      draggedId = null,
      dragOverId = null,
      onDragStartRow,
      onDragOverRow,
      onDropRow,
      onDragEndRow,
      onEditRow,
      onRemoveRow,
    },
    ref
  ) => {
    const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart) + 1, 1);
    const pxPerDay = PX_PER_DAY[gridMode];
    const chartWidth = totalDays * pxPerDay;
    const showDayHeader = gridMode === 'day' || gridMode === 'week';

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

    const days = useMemo(() => {
      if (!showDayHeader) return [];
      return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d, i) => ({
        date: d,
        left: i * pxPerDay,
        isWeekend: getDay(d) === 0 || getDay(d) === 6,
      }));
    }, [showDayHeader, rangeStart, rangeEnd, pxPerDay]);

    // Vertical reference lines behind the bars, granularity matches the view mode.
    const gridLines = useMemo(() => {
      if (gridMode === 'none') return [];
      if (gridMode === 'month') {
        return months.map((m) => m.left).filter((left) => left > 0.5);
      }
      const dates =
        gridMode === 'day'
          ? eachDayOfInterval({ start: rangeStart, end: rangeEnd })
          : eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });
      return dates
        .map((d) => differenceInDays(d, rangeStart) * pxPerDay)
        .filter((left) => left > 0.5);
    }, [gridMode, rangeStart, rangeEnd, months, pxPerDay]);

    const gridLineClass = gridMode === 'day' ? 'border-slate-100/70' : gridMode === 'week' ? 'border-slate-200/80' : 'border-slate-200';

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
        style={{ width: NAME_COL_WIDTH + chartWidth + 32, fontFamily: 'system-ui, -apple-system, sans-serif' }}
        className="bg-white text-slate-900 p-4"
      >
        <div className="mb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: stageColors[stage] }} />
              <span className="text-[11px] text-slate-600">{STAGE_LABELS[stage]}</span>
            </div>
          ))}
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden">
          {/* Month header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div style={{ width: NAME_COL_WIDTH }} className="flex-shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-r border-slate-200">
              Project
            </div>
            <div className="relative" style={{ width: chartWidth, height: 28 }}>
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

          {/* Day/week sub-header — only for the more zoomed-in views */}
          {showDayHeader && (
            <div className="flex border-b border-slate-200">
              <div style={{ width: NAME_COL_WIDTH }} className="flex-shrink-0 border-r border-slate-200 bg-slate-50/60" />
              <div className="relative" style={{ width: chartWidth, height: gridMode === 'day' ? 30 : 20 }}>
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      'absolute top-0 bottom-0 flex flex-col items-center justify-center border-r border-slate-100',
                      d.isWeekend && 'bg-slate-50'
                    )}
                    style={{ left: d.left, width: pxPerDay }}
                  >
                    {gridMode === 'day' && (
                      <span className="text-[8px] text-slate-400 leading-none">{format(d.date, 'EEE')}</span>
                    )}
                    <span className="text-[10px] text-slate-600 font-medium leading-none mt-0.5">{format(d.date, 'd')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rows */}
          {projects.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-slate-400">No projects selected</div>
          ) : (
            projects.map((project, idx) => {
              const betTag = getBetTag(project.reason);
              return (
              <div
                key={project.id}
                draggable={interactive}
                onDragStart={interactive ? () => onDragStartRow?.(project.id) : undefined}
                onDragOver={
                  interactive
                    ? (e) => {
                        e.preventDefault();
                        onDragOverRow?.(e, project.id);
                      }
                    : undefined
                }
                onDrop={interactive ? () => onDropRow?.(project.id) : undefined}
                onDragEnd={interactive ? onDragEndRow : undefined}
                className={cn(
                  'flex items-stretch border-b border-slate-100 last:border-b-0',
                  idx % 2 === 1 && 'bg-slate-50/60',
                  interactive && draggedId === project.id && 'opacity-40',
                  interactive && dragOverId === project.id && draggedId !== project.id && 'ring-2 ring-inset ring-blue-400'
                )}
                style={{ minHeight: MIN_ROW_HEIGHT }}
              >
                <div
                  style={{ width: NAME_COL_WIDTH }}
                  className="flex-shrink-0 px-3 py-2 flex items-center gap-1.5 border-r border-slate-200 min-w-0"
                >
                  {interactive && (
                    <GripVertical
                      data-html2canvas-ignore="true"
                      className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 cursor-grab active:cursor-grabbing"
                    />
                  )}
                  {betTag && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0 self-start mt-0.5">
                      {betTag}
                    </span>
                  )}
                  {showCategory && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white flex-shrink-0 self-start mt-0.5"
                      style={{ backgroundColor: categoryColors[project.category] }}
                    >
                      {project.category.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  {project.priority && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 flex-shrink-0 self-start mt-0.5">
                      P{project.priority}
                    </span>
                  )}
                  <span className={cn('text-xs font-medium leading-snug whitespace-normal break-words flex-1 min-w-0', project.discarded && 'line-through text-slate-400')}>
                    {project.name}
                  </span>
                  {interactive && (
                    <div data-html2canvas-ignore="true" className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditRow?.(project.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                        title="Edit dates or label"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveRow?.(project.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600"
                        title="Remove from chart"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ width: chartWidth, minHeight: MIN_ROW_HEIGHT }} className="relative flex-shrink-0">
                  {showDayHeader &&
                    days.filter((d) => d.isWeekend).map((d, i) => (
                      <div key={i} className="absolute top-0 bottom-0 bg-slate-50/60" style={{ left: d.left, width: pxPerDay }} />
                    ))}
                  {gridLines.map((left, i) => (
                    <div key={i} className={cn('absolute top-0 bottom-0 border-r', gridLineClass)} style={{ left }} />
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
              );
            })
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-3">
          Generated {format(new Date(), 'MMM d, yyyy')} · CLMS Planner
        </p>
      </div>
    );
  }
);

PublisherGanttChart.displayName = 'PublisherGanttChart';
