import { useState, useEffect } from 'react';
import { Project, ProjectCategory, ProjectPriority, CATEGORY_LABELS, PRIORITY_LABELS, PRIORITY_ORDER, STAGE_LABELS, STAGE_ORDER, LifecycleStage, StageDate } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Link, XCircle, Save } from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { useSprints } from '@/hooks/useSprints';

interface ProjectFormProps {
  project?: Project | null;
  open: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, persistToLiveProject: boolean) => void;
  /** When true, shows a checkbox letting the user opt into also writing this
   * edit back to the real project (used by the Gantt Publisher, where edits
   * are chart-local by default). Unchecked by default. */
  showPersistToggle?: boolean;
}

const emptyStages: Record<LifecycleStage, StageDate> = {
  requirement: { startDate: null, endDate: null },
  design: { startDate: null, endDate: null },
  development: { startDate: null, endDate: null },
  qa: { startDate: null, endDate: null },
  release: { startDate: null, endDate: null },
};

export const ProjectForm = ({ project, open, onClose, onSave, showPersistToggle = false }: ProjectFormProps) => {
  const { sprints } = useSprints();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('content');
  const [priority, setPriority] = useState<ProjectPriority | null>(null);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [stages, setStages] = useState<Record<LifecycleStage, StageDate>>({ ...emptyStages });
  const [discarded, setDiscarded] = useState(false);
  const [jiraLink, setJiraLink] = useState('');
  const [reason, setReason] = useState('');
  const [persistToLive, setPersistToLive] = useState(false);

  // Reset form when project changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(project?.name || '');
      setCategory(project?.category || 'content');
      setPriority(project?.priority ?? null);
      setSprintId(project?.sprintId ?? null);
      setStages(project?.stages || { ...emptyStages });
      setDiscarded(project?.discarded || false);
      setJiraLink(project?.jiraLink || '');
      setReason(project?.reason || '');
      setPersistToLive(false);
    }
  }, [project, open]);

  const handleStageChange = (stage: LifecycleStage, field: 'startDate' | 'endDate', value: string | null) => {
    setStages((prev) => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        id: project?.id,
        name,
        category,
        priority,
        sprintId,
        stages,
        discarded,
        jiraLink: jiraLink || null,
        reason: reason || null,
      },
      showPersistToggle ? persistToLive : true
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {project ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {showPersistToggle && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="persistToLive" className="cursor-pointer">
                  Also update the actual project (timelines, label, etc.)
                </Label>
              </div>
              <Switch
                id="persistToLive"
                checked={persistToLive}
                onCheckedChange={setPersistToLive}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority === null ? 'none' : String(priority)}
                onValueChange={(v) => setPriority(v === 'none' ? null : (Number(v) as ProjectPriority))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unset</SelectItem>
                  {PRIORITY_ORDER.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint">Sprint</Label>
            <Select
              value={sprintId ?? 'none'}
              onValueChange={(v) => setSprintId(v === 'none' ? null : v)}
            >
              <SelectTrigger id="sprint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.startDate} → {s.endDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraLink" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Jira/Story Link (optional)
            </Label>
            <Input
              id="jiraLink"
              type="url"
              value={jiraLink}
              onChange={(e) => setJiraLink(e.target.value)}
              placeholder="https://jira.example.com/browse/PROJECT-123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Notes (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason or notes for this project"
            />
          </div>

          {project && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <Label htmlFor="discarded" className="cursor-pointer">Mark as Discarded</Label>
              </div>
              <Switch
                id="discarded"
                checked={discarded}
                onCheckedChange={setDiscarded}
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Lifecycle Stage Dates
            </h3>
            
            {STAGE_ORDER.map((stage) => (
              <div key={stage} className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm stage-${stage}`} />
                  <Label className="text-sm">{STAGE_LABELS[stage]}</Label>
                </div>
                <div>
                  <DatePicker
                    value={stages[stage].startDate}
                    onChange={(value) => handleStageChange(stage, 'startDate', value)}
                    placeholder="Start Date"
                  />
                </div>
                <div>
                  <DatePicker
                    value={stages[stage].endDate}
                    onChange={(value) => handleStageChange(stage, 'endDate', value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? 'Save Changes' : 'Add Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};