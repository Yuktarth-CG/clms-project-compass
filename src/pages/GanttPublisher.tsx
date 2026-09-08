import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { isAuthenticated } from '@/lib/auth';
import { Header } from '@/components/Header';
import { PublisherGanttChart } from '@/components/PublisherGanttChart';
import { DatePicker } from '@/components/DatePicker';
import { useProjects } from '@/hooks/useProjects';
import { Project, STAGE_ORDER, STAGE_LABELS, LifecycleStage } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, FileImage, FileDown, GanttChartSquare, Loader2, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const cloneProject = (p: Project): Project => JSON.parse(JSON.stringify(p));

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'gantt-chart';

const GanttPublisher = () => {
  const navigate = useNavigate();
  const { projects: allProjects, loading, updateProject } = useProjects();
  const chartRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [working, setWorking] = useState<Record<string, Project>>({});
  const [title, setTitle] = useState('CLMS Roadmap');
  const [subtitle, setSubtitle] = useState('');
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const filteredPickerProjects = useMemo(() => {
    if (!searchTerm.trim()) return allProjects;
    const term = searchTerm.toLowerCase();
    return allProjects.filter((p) => p.name.toLowerCase().includes(term));
  }, [allProjects, searchTerm]);

  const toggleProject = (project: Project) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(project.id);
      if (isSelected) {
        return prev.filter((id) => id !== project.id);
      }
      return [...prev, project.id];
    });
    setWorking((prev) => {
      if (prev[project.id]) return prev;
      return { ...prev, [project.id]: cloneProject(project) };
    });
  };

  const removeProject = (projectId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== projectId));
  };

  const selectedProjects = selectedIds.map((id) => working[id]).filter(Boolean);

  const handleStageChange = (
    projectId: string,
    stage: LifecycleStage,
    field: 'startDate' | 'endDate',
    value: string | null
  ) => {
    setWorking((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        stages: {
          ...prev[projectId].stages,
          [stage]: { ...prev[projectId].stages[stage], [field]: value },
        },
      },
    }));
  };

  const handleSaveToProject = async (projectId: string) => {
    const p = working[projectId];
    if (!p) return;
    await updateProject(projectId, p);
  };

  const fitRangeToSelection = () => {
    const allDates: Date[] = [];
    selectedProjects.forEach((p) => {
      STAGE_ORDER.forEach((stage) => {
        const { startDate, endDate } = p.stages[stage];
        if (startDate) allDates.push(new Date(startDate + 'T00:00:00'));
        if (endDate) allDates.push(new Date(endDate + 'T00:00:00'));
      });
    });
    if (allDates.length === 0) {
      toast.error('Selected projects have no dates to fit');
      return;
    }
    const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
    setRangeStart(min.toISOString().slice(0, 10));
    setRangeEnd(max.toISOString().slice(0, 10));
  };

  useEffect(() => {
    if (!rangeStart && !rangeEnd && selectedProjects.length > 0) {
      fitRangeToSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjects.length]);

  const effectiveRangeStart = rangeStart ? new Date(rangeStart + 'T00:00:00') : new Date();
  const effectiveRangeEnd = rangeEnd
    ? new Date(rangeEnd + 'T00:00:00')
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const captureCanvas = async () => {
    if (!chartRef.current) return null;
    return html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
  };

  const handleExportPng = async () => {
    setExporting('png');
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${slugify(title)}.png`;
      link.click();
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Export PNG failed:', error);
      toast.error('Failed to export image');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${slugify(title)}.pdf`);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('Export PDF failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <GanttChartSquare className="w-6 h-6 text-primary" />
            Gantt Chart Publisher
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hand-pick projects, adjust dates for the shared view, and export as an image or PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Picker panel */}
          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pick Projects ({selectedIds.length} selected)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[480px] overflow-y-auto space-y-1 scrollbar-thin">
                {filteredPickerProjects.map((project) => {
                  const isSelected = selectedIds.includes(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => toggleProject(project)}
                      className={cn(
                        'w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md border text-sm transition-colors',
                        isSelected
                          ? 'bg-primary/10 border-primary/40'
                          : 'border-transparent hover:bg-secondary/50'
                      )}
                    >
                      <span className={`category-badge category-${project.category} flex-shrink-0`}>
                        {project.category.slice(0, 3).toUpperCase()}
                      </span>
                      <span className={cn('truncate flex-1', project.discarded && 'line-through text-muted-foreground')}>
                        {project.name}
                      </span>
                    </button>
                  );
                })}
                {filteredPickerProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No projects found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main publisher area */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Chart Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chart title" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Subtitle (optional)</label>
                    <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Q3 Exec Update" />
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CalendarRange className="w-3.5 h-3.5" /> Range Start
                    </label>
                    <DatePicker value={rangeStart} onChange={setRangeStart} placeholder="Start" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Range End</label>
                    <DatePicker value={rangeEnd} onChange={setRangeEnd} placeholder="End" />
                  </div>
                  <Button variant="outline" size="sm" onClick={fitRangeToSelection}>
                    Fit to selection
                  </Button>
                  <div className="flex-1" />
                  <Button size="sm" onClick={handleExportPng} disabled={exporting !== null}>
                    {exporting === 'png' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileImage className="w-4 h-4 mr-2" />}
                    Export PNG
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleExportPdf} disabled={exporting !== null}>
                    {exporting === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live preview (this is what gets captured) */}
            <div className="overflow-x-auto border border-border rounded-lg p-4 bg-secondary/10">
              <PublisherGanttChart
                ref={chartRef}
                title={title}
                subtitle={subtitle}
                projects={selectedProjects}
                rangeStart={effectiveRangeStart}
                rangeEnd={effectiveRangeEnd}
              />
            </div>

            {/* Editable dates table */}
            {selectedProjects.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Adjust Dates</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Changes here only affect this chart until you click "Save to project".
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProjects.map((project) => (
                    <div key={project.id} className="border border-border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`category-badge category-${project.category} flex-shrink-0`}>
                            {project.category.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium truncate">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleSaveToProject(project.id)}>
                            Save to project
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeProject(project.id)} title="Remove from chart">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {STAGE_ORDER.map((stage) => (
                          <div key={stage} className="space-y-1">
                            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-sm inline-block stage-${stage}`} />
                              {STAGE_LABELS[stage]}
                            </label>
                            <div className="flex gap-1.5">
                              <DatePicker
                                value={project.stages[stage].startDate}
                                onChange={(v) => handleStageChange(project.id, stage, 'startDate', v)}
                                placeholder="Start"
                              />
                              <DatePicker
                                value={project.stages[stage].endDate}
                                onChange={(v) => handleStageChange(project.id, stage, 'endDate', v)}
                                placeholder="End"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GanttPublisher;
