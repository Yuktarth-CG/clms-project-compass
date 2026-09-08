import { useMemo, useState } from 'react';
import { Project, Sprint } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Search, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateFormat } from '@/contexts/DateFormatContext';

interface SprintCardProps {
  sprint: Sprint;
  allProjects: Project[];
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
  onAssign: (projectId: string, sprintId: string) => void;
  onUnassign: (projectId: string) => void;
}

export const SprintCard = ({ sprint, allProjects, onEdit, onDelete, onAssign, onUnassign }: SprintCardProps) => {
  const { formatDate } = useDateFormat();
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const assignedStories = useMemo(
    () => allProjects.filter((p) => p.sprintId === sprint.id),
    [allProjects, sprint.id]
  );

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allProjects
      .filter((p) => p.sprintId !== sprint.id && p.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [allProjects, sprint.id, searchTerm]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 text-left flex-1 min-w-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{sprint.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)} · {assignedStories.length} {assignedStories.length === 1 ? 'story' : 'stories'}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(sprint)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(sprint.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Assigned stories */}
          {assignedStories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stories assigned yet.</p>
          ) : (
            <div className="space-y-1.5">
              {assignedStories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-secondary/40 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`category-badge category-${story.category}`}>
                      {story.category.slice(0, 3).toUpperCase()}
                    </span>
                    <span className={cn('text-sm truncate', story.discarded && 'line-through text-muted-foreground')}>
                      {story.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    title="Remove from sprint"
                    onClick={() => onUnassign(story.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Search + assign */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stories to assign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-secondary/40 border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`category-badge category-${story.category}`}>
                        {story.category.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="text-sm truncate">{story.name}</span>
                      {story.sprintId && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">(in another sprint)</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      title="Assign to this sprint"
                      onClick={() => {
                        onAssign(story.id, sprint.id);
                        setSearchTerm('');
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {searchTerm.trim() && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground px-1">No matching stories found.</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
