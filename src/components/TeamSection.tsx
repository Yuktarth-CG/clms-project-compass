import { TeamMember } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

export const TeamSection = ({ teamMembers }: TeamSectionProps) => {
  if (teamMembers.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border',
                member.isSharedResource && 'border-dashed'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">{member.name}</span>
                  {member.isSharedResource && (
                    <span title="Shared Resource">
                      <Star className="w-3 h-3 text-muted-foreground" />
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};