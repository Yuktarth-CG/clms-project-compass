import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { isAuthenticated } from '@/lib/auth';
import { Header } from '@/components/Header';
import { PublisherGanttChart } from '@/components/PublisherGanttChart';
import { DatePicker } from '@/components/DatePicker';
import { ProjectForm } from '@/components/ProjectForm';
import { useProjects } from '@/hooks/useProjects';
import { useGanttCharts } from '@/hooks/useGanttCharts';
import { Project, SavedGanttChart, GanttGridMode, STAGE_ORDER } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Search, X, FileImage, FileDown, GanttChartSquare, Loader2, CalendarRange,
  Save, Copy, FolderOpen, Trash2, PlusCircle, CalendarDays, GripVertical, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const cloneProject = (p: Project): Project => JSON.parse(JSON.stringify(p));

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'gantt-chart';

const GanttPublisher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects: allProjects, loading, updateProject } = useProjects();
  const { charts, loading: chartsLoading, saveChart, updateChart, deleteChart } = useGanttCharts();
  const chartRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [working, setWorking] = useState<Record<string, Project>>({});
  const [title, setTitle] = useState('CLMS Roadmap');
  const [subtitle, setSubtitle] = useState('');
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState<GanttGridMode>('month');
  const [showCategory, setShowCategory] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);
  const [loadedChartId, setLoadedChartId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Mirrors draggedId synchronously — the drop handler reads this instead of
  // state, since state updates from dragstart aren't guaranteed to have
  // flushed/re-rendered by the time drop fires on a fast drag.
  const draggedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    }
  }, [navigate, location]);

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

  const openEditProject = (projectId: string) => {
    setEditingProjectId(projectId);
    setProjectFormOpen(true);
  };

  const handleProjectFormSave = async (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    persistToLiveProject: boolean
  ) => {
    const id = data.id;
    if (!id) return;
    setWorking((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data, id },
    }));
    if (persistToLiveProject) {
      await updateProject(id, data);
    }
  };

  const handleDragStart = (id: string) => {
    draggedIdRef.current = id;
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  };

  const handleDragEnd = () => {
    draggedIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (targetId: string) => {
    const sourceId = draggedIdRef.current;
    if (sourceId && sourceId !== targetId) {
      setSelectedIds((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(sourceId);
        const toIdx = next.indexOf(targetId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, sourceId);
        return next;
      });
    }
    draggedIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
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

  // Load a saved chart's selection, overrides, title/subtitle/range into working state.
  const loadChart = (chart: SavedGanttChart) => {
    const validIds = chart.projectIds.filter((id) => allProjects.some((p) => p.id === id));
    const skipped = chart.projectIds.length - validIds.length;
    const nextWorking: Record<string, Project> = {};
    validIds.forEach((id) => {
      const live = allProjects.find((p) => p.id === id)!;
      const clone = cloneProject(live);
      const override = chart.overrides[id];
      if (override) clone.stages = override;
      nextWorking[id] = clone;
    });
    setWorking(nextWorking);
    setSelectedIds(validIds);
    setTitle(chart.title);
    setSubtitle(chart.subtitle || '');
    setRangeStart(chart.rangeStart);
    setRangeEnd(chart.rangeEnd);
    setGridMode(chart.gridMode);
    setShowCategory(chart.showCategory);
    setLoadedChartId(chart.id);
    setSearchParams({ chart: chart.id }, { replace: true });
    if (skipped > 0) {
      toast.info(`${skipped} project(s) in this chart no longer exist and were skipped`);
    }
  };

  // Auto-load a chart referenced by ?chart=<id> once projects & charts have both loaded.
  useEffect(() => {
    if (autoLoadAttempted || loading || chartsLoading) return;
    const chartId = searchParams.get('chart');
    if (chartId) {
      const found = charts.find((c) => c.id === chartId);
      if (found) {
        loadChart(found);
      } else {
        toast.error('Saved chart not found (it may have been deleted)');
      }
    }
    setAutoLoadAttempted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, chartsLoading, charts, autoLoadAttempted]);

  const buildChartPayload = (): Omit<SavedGanttChart, 'id' | 'createdAt' | 'updatedAt'> => {
    const overrides: SavedGanttChart['overrides'] = {};
    selectedIds.forEach((id) => {
      if (working[id]) overrides[id] = working[id].stages;
    });
    return {
      name: title,
      title,
      subtitle: subtitle || null,
      rangeStart,
      rangeEnd,
      gridMode,
      showCategory,
      projectIds: selectedIds,
      overrides,
    };
  };

  const handleSave = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Pick at least one project before saving');
      return;
    }
    setSaving(true);
    try {
      const payload = buildChartPayload();
      if (loadedChartId) {
        const updated = await updateChart(loadedChartId, payload);
        if (updated) setSearchParams({ chart: updated.id }, { replace: true });
      } else {
        const created = await saveChart(payload);
        if (created) {
          setLoadedChartId(created.id);
          setSearchParams({ chart: created.id }, { replace: true });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Pick at least one project before saving');
      return;
    }
    setSaving(true);
    try {
      const created = await saveChart(buildChartPayload());
      if (created) {
        setLoadedChartId(created.id);
        setSearchParams({ chart: created.id }, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChart = async (id: string) => {
    if (!confirm('Delete this saved chart? This cannot be undone.')) return;
    await deleteChart(id);
    if (loadedChartId === id) {
      setLoadedChartId(null);
      searchParams.delete('chart');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleCopyLink = async () => {
    if (!loadedChartId) return;
    const url = `${window.location.origin}/gantt-publisher?chart=${loadedChartId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shareable link copied');
    } catch {
      toast.error('Could not copy — copy it from the address bar instead');
    }
  };

  const handleNewChart = () => {
    setSelectedIds([]);
    setWorking({});
    setTitle('CLMS Roadmap');
    setSubtitle('');
    setRangeStart(null);
    setRangeEnd(null);
    setGridMode('month');
    setShowCategory(false);
    setLoadedChartId(null);
    searchParams.delete('chart');
    setSearchParams(searchParams, { replace: true });
  };

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

  if (loading || chartsLoading) {
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
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <GanttChartSquare className="w-6 h-6 text-primary" />
              Gantt Chart Publisher
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Hand-pick projects, adjust dates for the shared view, and export as an image or PDF.
            </p>
          </div>
          {loadedChartId && (
            <Button variant="outline" size="sm" onClick={handleNewChart}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Chart
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Picker panel */}
          <div className="space-y-4 lg:sticky lg:top-20 h-fit">
            {charts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Saved Charts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                  {charts.map((chart) => (
                    <div
                      key={chart.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-2 rounded-md border text-sm',
                        loadedChartId === chart.id ? 'bg-primary/10 border-primary/40' : 'border-transparent hover:bg-secondary/50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => loadChart(chart)}
                        className="flex-1 min-w-0 text-left truncate"
                        title={chart.name}
                      >
                        {chart.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleDeleteChart(chart.id)}
                        title="Delete saved chart"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
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
                <div className="max-h-[400px] overflow-y-auto space-y-1 scrollbar-thin">
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
          </div>

          {/* Main publisher area */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Chart Title (also used as save name)</label>
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> View
                    </label>
                    <Select value={gridMode} onValueChange={(v) => setGridMode(v as GanttGridMode)}>
                      <SelectTrigger className="h-10 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Overview</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Switch id="show-category" checked={showCategory} onCheckedChange={setShowCategory} />
                    <Label htmlFor="show-category" className="text-xs font-medium text-muted-foreground cursor-pointer">
                      Show project type
                    </Label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {loadedChartId ? 'Update Saved Chart' : 'Save Chart'}
                  </Button>
                  {loadedChartId && (
                    <>
                      <Button size="sm" variant="outline" onClick={handleSaveAsNew} disabled={saving}>
                        Save as New
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCopyLink}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Shareable Link
                      </Button>
                    </>
                  )}
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
                {loadedChartId && (
                  <p className="text-xs text-muted-foreground">
                    Anyone who opens this chart's shareable link will be asked to log in, then land right here to edit and export it.
                  </p>
                )}
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
                gridMode={gridMode}
                showCategory={showCategory}
              />
            </div>

            {/* Selected projects: drag to reorder, edit via the shared project overlay */}
            {selectedProjects.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Selected Projects</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Drag <GripVertical className="w-3 h-3 inline -mt-0.5" /> to reorder rows. Edits from the pencil icon only affect this chart unless you check "Also update the actual project".
                  </p>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {selectedProjects.map((project) => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={() => handleDragStart(project.id)}
                      onDragOver={(e) => handleDragOver(e, project.id)}
                      onDrop={() => handleDrop(project.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-card transition-colors',
                        draggedId === project.id && 'opacity-40',
                        dragOverId === project.id && draggedId !== project.id && 'border-primary/60 bg-primary/5'
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing" />
                      <span className={`category-badge category-${project.category} flex-shrink-0`}>
                        {project.category.slice(0, 3).toUpperCase()}
                      </span>
                      {project.priority && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex-shrink-0">
                          P{project.priority}
                        </span>
                      )}
                      <span className={cn('text-sm truncate flex-1', project.discarded && 'line-through text-muted-foreground')}>
                        {project.name}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => openEditProject(project.id)} title="Edit dates or label">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeProject(project.id)} title="Remove from chart">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <ProjectForm
        project={editingProjectId ? working[editingProjectId] : null}
        open={projectFormOpen}
        onClose={() => { setProjectFormOpen(false); setEditingProjectId(null); }}
        onSave={handleProjectFormSave}
        showPersistToggle
      />
    </div>
  );
};

export default GanttPublisher;
