import { useState, useEffect } from 'react';
import { TeamMember } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';

interface TeamMemberFormProps {
  member?: TeamMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<TeamMember, 'id' | 'createdAt'> & { id?: string }) => void;
  nextOrder: number;
}

export const TeamMemberForm = ({ member, open, onClose, onSave, nextOrder }: TeamMemberFormProps) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isSharedResource, setIsSharedResource] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    if (open) {
      setName(member?.name || '');
      setRole(member?.role || '');
      setIsSharedResource(member?.isSharedResource || false);
      setDisplayOrder(member?.displayOrder ?? nextOrder);
    }
  }, [member, open, nextOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: member?.id,
      name,
      role,
      isSharedResource,
      displayOrder,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter role (e.g., Frontend Developer)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="shared" className="cursor-pointer">Shared Resource</Label>
            <Switch
              id="shared"
              checked={isSharedResource}
              onCheckedChange={setIsSharedResource}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};