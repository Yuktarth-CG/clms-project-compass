import { ProjectCategory, CATEGORY_LABELS } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { ProjectStatus } from './StatusSummary';

interface CategoryFilterProps {
  selected: ProjectCategory | 'all';
  onChange: (category: ProjectCategory | 'all') => void;
  counts: Record<ProjectCategory | 'all', number>;
  statusFilter?: ProjectStatus | 'all';
  onStatusChange?: (status: ProjectStatus | 'all') => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const statusLabels: Record<ProjectStatus | 'all', string> = {
  all: 'All',
  pipeline: 'Pipeline',
  requirement: 'Requirements',
  design: 'Design',
  ready_for_dev: 'Ready for Dev',
  development: 'Development',
  ready_for_qa: 'Ready for QA',
  qa: 'QA',
  release: 'Release',
  completed: 'Completed',
};

export const CategoryFilter = ({ 
  selected, 
  onChange, 
  counts, 
  statusFilter = 'all', 
  onStatusChange,
  searchTerm = '',
  onSearchChange 
}: CategoryFilterProps) => {
  const categories: (ProjectCategory | 'all')[] = ['all', 'content', 'vanilla', 'enhancement'];
  const statuses: (ProjectStatus | 'all')[] = ['all', 'pipeline', 'requirement', 'design', 'ready_for_dev', 'development', 'ready_for_qa', 'qa', 'release', 'completed'];

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      {onSearchChange && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-8 h-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-2">Category:</span>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selected === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(cat)}
            className={cn(
              'text-xs capitalize',
              selected === cat && 'shadow-sm'
            )}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            <span className="ml-1.5 text-xs opacity-70">({counts[cat]})</span>
          </Button>
        ))}
      </div>

      {/* Status Filter */}
      {onStatusChange && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-2">Status:</span>
          {statuses.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(status)}
              className={cn(
                'text-xs',
                statusFilter === status && 'shadow-sm'
              )}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};