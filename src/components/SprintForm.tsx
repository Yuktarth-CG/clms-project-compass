import { useState, useEffect } from 'react';
import { Sprint } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/DatePicker';
import { CalendarRange } from 'lucide-react';

interface SprintFormProps {
  sprint?: Sprint | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Sprint, 'id' | 'createdAt'> & { id?: string }) => void;
}

export const SprintForm = ({ sprint, open, onClose, onSave }: SprintFormProps) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(sprint?.name || '');
      setStartDate(sprint?.startDate || null);
      setEndDate(sprint?.endDate || null);
    }
  }, [sprint, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    onSave({
      id: sprint?.id,
      name,
      startDate,
      endDate,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-primary" />
            {sprint ? 'Edit Sprint' : 'Add Sprint'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sprintName">Sprint Name</Label>
            <Input
              id="sprintName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sprint 1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Start Date" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="End Date" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!startDate || !endDate}>
              {sprint ? 'Save Changes' : 'Add Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
