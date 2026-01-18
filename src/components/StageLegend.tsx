import { LifecycleStage, STAGE_LABELS, STAGE_ORDER } from '@/types/project';

const stageColors: Record<LifecycleStage, string> = {
  requirement: 'bg-[hsl(226,70%,55%)]',
  design: 'bg-[hsl(271,81%,56%)]',
  development: 'bg-[hsl(187,92%,41%)]',
  qa: 'bg-[hsl(38,92%,50%)]',
  release: 'bg-[hsl(152,69%,41%)]',
};

export const StageLegend = () => {
  return (
    <div className="flex items-center gap-3 flex-wrap bg-card border border-border rounded-lg px-4 py-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stages:</span>
      {STAGE_ORDER.map((stage) => (
        <div key={stage} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm ${stageColors[stage]}`} />
          <span className="text-xs text-foreground">{STAGE_LABELS[stage]}</span>
        </div>
      ))}
    </div>
  );
};
