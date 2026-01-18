import { useState } from 'react';
import { RiskItem } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface RiskFormProps {
  risk?: RiskItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (risk: Omit<RiskItem, 'id' | 'createdAt'> & { id?: string }) => void;
}

const severityOptions: RiskItem['severity'][] = ['low', 'medium', 'high', 'critical'];

export const RiskForm = ({ risk, open, onClose, onSave }: RiskFormProps) => {
  const [text, setText] = useState(risk?.text || '');
  const [severity, setSeverity] = useState<RiskItem['severity']>(risk?.severity || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: risk?.id,
      text,
      severity,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-risk-high" />
            {risk ? 'Edit Risk' : 'Add New Risk'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as RiskItem['severity'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    <span className="capitalize">{option}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Description</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the risk or blocker..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {risk ? 'Save Changes' : 'Add Risk'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
