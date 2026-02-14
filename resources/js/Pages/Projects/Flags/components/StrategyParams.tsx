import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  strategyName: string;
  parameters: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export default function StrategyParams({
  strategyName,
  parameters,
  onChange,
}: Props) {
  if (strategyName === "gradualRollout") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Rollout percentage</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={parameters.rollout ?? 0}
              onChange={(e) =>
                onChange({
                  ...parameters,
                  rollout: Math.min(100, Math.max(0, Number(e.target.value))),
                })
              }
              className="h-9 text-sm w-24"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Stickiness</Label>
          <Select
            value={parameters.stickiness ?? "default"}
            onValueChange={(v) =>
              onChange({ ...parameters, stickiness: v })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="userId">User ID</SelectItem>
              <SelectItem value="sessionId">Session ID</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Group ID (optional)</Label>
          <Input
            placeholder="e.g. experiment-1"
            value={parameters.groupId ?? ""}
            onChange={(e) =>
              onChange({ ...parameters, groupId: e.target.value })
            }
            className="h-9 text-sm"
          />
        </div>
      </div>
    );
  }

  if (strategyName === "userWithId") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">User IDs (one per line)</Label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
          placeholder={"user-1\nuser-2\nuser-3"}
          value={parameters.userIds ?? ""}
          onChange={(e) =>
            onChange({ ...parameters, userIds: e.target.value })
          }
        />
      </div>
    );
  }

  if (strategyName === "remoteAddress") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">IP addresses (one per line)</Label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
          placeholder={"192.168.1.0/24\n10.0.0.1"}
          value={parameters.ips ?? ""}
          onChange={(e) => onChange({ ...parameters, ips: e.target.value })}
        />
      </div>
    );
  }

  // "default" strategy — no parameters needed
  return null;
}
