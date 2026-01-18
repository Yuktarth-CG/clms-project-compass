import { useState, useEffect } from 'react';
import { Accomplishment, Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy } from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';

interface AccomplishmentFormProps {
  accomplishment?: Accomplishment | null;
  projects: Project[];
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Accomplishment, 'id' | 'createdAt'> & { id?: string }) => void;
}

export const AccomplishmentForm = ({ accomplishment, projects, open, onClose, onSave }: AccomplishmentFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(accomplishment?.title || '');
      setDescription(accomplishment?.description || '');
      setCompletedAt(accomplishment?.completedAt || new Date().toISOString().split('T')[0]);
      setProjectId(accomplishment?.projectId || null);
    }
  }, [accomplishment, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: accomplishment?.id,
      title,
      description: description || null,
      completedAt: completedAt || new Date().toISOString().split('T')[0],
      projectId,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-stage-release" />
            {accomplishment ? 'Edit Accomplishment' : 'Add Accomplishment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter accomplishment title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Completion Date</Label>
              <DatePicker
                value={completedAt}
                onChange={setCompletedAt}
                placeholder="Select date"
              />
            </div>

            <div className="space-y-2">
              <Label>Related Project (optional)</Label>
              <Select value={projectId || 'none'} onValueChange={(v) => setProjectId(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {accomplishment ? 'Save Changes' : 'Add Accomplishment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};