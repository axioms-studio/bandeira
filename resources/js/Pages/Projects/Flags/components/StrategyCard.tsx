import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Shield } from "lucide-react";

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
  default: "Default",
  gradualRollout: "Gradual Rollout",
  userWithId: "User Targeting",
  remoteAddress: "IP Filtering",
};

interface Props {
  strategy: StrategyData;
  onEdit: () => void;
  onDelete: () => void;
}

export default function StrategyCard({ strategy, onEdit, onDelete }: Props) {
  const summary = paramSummary(strategy.name, strategy.parameters);

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              {STRATEGY_LABELS[strategy.name] ?? strategy.name}
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
              <Shield className="w-3 h-3" />
              {strategy.constraints.length} constraint
              {strategy.constraints.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
