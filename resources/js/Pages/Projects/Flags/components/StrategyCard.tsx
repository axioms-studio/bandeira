export interface StrategyData {
  id: number;
  name: string;
  parameters: Record<string, any> | null;
  sort_order: number;
  constraints: ConstraintData[];
}

export interface ConstraintData {
  id: number;
  context_name: string;
  operator: string;
  values: string[];
  inverted: boolean;
  case_insensitive: boolean;
}

function paramSummary(name: string, params: Record<string, any> | null): string {
  if (!params) return "";
  if (name === "gradualRollout") {
    return `${params.rollout ?? 0}% rollout, stickiness: ${params.stickiness ?? "default"}`;
  }
  if (name === "userWithId") {
    const ids = (params.userIds ?? "").split("\n").filter(Boolean);
    return `${ids.length} user${ids.length !== 1 ? "s" : ""}`;
  }
  if (name === "remoteAddress") {
    const ips = (params.ips ?? "").split("\n").filter(Boolean);
    return `${ips.length} IP rule${ips.length !== 1 ? "s" : ""}`;
  }
  return "";
}

const STRATEGY_LABELS: Record<string, string> = {
  default: "default",
  gradualRollout: "gradual_rollout",
  userWithId: "user_targeting",
  remoteAddress: "ip_filtering",
};

interface Props {
  strategy: StrategyData;
  onEdit: () => void;
  onDelete: () => void;
}

export default function StrategyCard({ strategy, onEdit, onDelete }: Props) {
  const summary = paramSummary(strategy.name, strategy.parameters);

  return (
    <div className="border border-border p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary border border-primary/30 px-1.5 py-0.5">
              [{STRATEGY_LABELS[strategy.name] ?? strategy.name}]
            </span>
            <span className="text-xs text-muted-foreground">
              #{strategy.sort_order}
            </span>
          </div>
          {summary && (
            <p className="text-sm text-muted-foreground mt-1">{summary}</p>
          )}
          {strategy.constraints.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              {strategy.constraints.length} constraint
              {strategy.constraints.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            [edit]
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            [x]
          </button>
        </div>
      </div>
    </div>
  );
}
