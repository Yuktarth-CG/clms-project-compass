import { RiskItem } from '@/types/project';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

interface RiskPanelProps {
  risks: RiskItem[];
}

const severityIcons = {
  low: Info,
  medium: AlertCircle,
  high: AlertTriangle,
  critical: XCircle,
};

export const RiskPanel = ({ risks }: RiskPanelProps) => {
  if (risks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="w-4 h-4" />
          <span className="text-sm">No active risks or blockers</span>
        </div>
      </div>
    );
  }

  const sortedRisks = [...risks].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 animate-fade-in">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Areas of Risk
      </h2>
      <div className="space-y-2">
        {sortedRisks.map((risk) => {
          const Icon = severityIcons[risk.severity];
          return (
            <div
              key={risk.id}
              className="flex items-start gap-3 p-3 bg-secondary/50 rounded-md"
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 text-risk-${risk.severity}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">{risk.text}</p>
              </div>
              <span className={`risk-badge risk-${risk.severity}`}>
                {risk.severity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
