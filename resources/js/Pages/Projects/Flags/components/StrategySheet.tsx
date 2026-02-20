import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import StrategyParams from "./StrategyParams";
import ConstraintRow, { type ConstraintData } from "./ConstraintRow";
import type { StrategyData } from "./StrategyCard";

const STRATEGY_TYPES = [
  { value: "default", label: "default (always on)" },
  { value: "gradualRollout", label: "gradual_rollout" },
  { value: "userWithId", label: "user_targeting" },
  { value: "remoteAddress", label: "ip_filtering" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: StrategyData | null;
  onSave: (data: {
    name: string;
    parameters: Record<string, any>;
    sort_order: number;
    constraints: ConstraintData[];
  }) => Promise<void>;
}

const emptyConstraint = (): ConstraintData => ({
  context_name: "",
  operator: "IN",
  values: [],
  inverted: false,
  case_insensitive: false,
});

export default function StrategySheet({
  open,
  onOpenChange,
  strategy,
  onSave,
}: Props) {
  const [name, setName] = useState("default");
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [sortOrder, setSortOrder] = useState(0);
  const [constraints, setConstraints] = useState<ConstraintData[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (strategy) {
        setName(strategy.name);
        setParameters(strategy.parameters ?? {});
        setSortOrder(strategy.sort_order);
        setConstraints(
          strategy.constraints.map((c) => ({
            context_name: c.context_name,
            operator: c.operator,
            values: c.values,
            inverted: c.inverted,
            case_insensitive: c.case_insensitive,
          }))
        );
      } else {
        setName("default");
        setParameters({});
        setSortOrder(0);
        setConstraints([]);
      }
    }
  }, [open, strategy]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, parameters, sort_order: sortOrder, constraints });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const updateConstraint = (index: number, c: ConstraintData) => {
    setConstraints((prev) => prev.map((item, i) => (i === index ? c : item)));
  };

  const removeConstraint = (index: number) => {
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {">"} {strategy ? "edit_strategy" : "add_strategy"}
          </SheetTitle>
          <SheetDescription>
            // configure how this flag is evaluated
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          <div className="space-y-1.5">
            <Label className="text-sm">strategy_type</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">sort_order</Label>
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="h-9 text-sm w-24"
            />
          </div>

          <StrategyParams
            strategyName={name}
            parameters={parameters}
            onChange={setParameters}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">// constraints</Label>
              <button
                type="button"
                onClick={() =>
                  setConstraints((prev) => [...prev, emptyConstraint()])
                }
                className="inline-flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-2 py-1"
              >
                [+ add]
              </button>
            </div>
            {constraints.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No constraints — strategy applies to all users.
              </p>
            )}
            {constraints.map((c, i) => (
              <ConstraintRow
                key={i}
                constraint={c}
                onChange={(updated) => updateConstraint(i, updated)}
                onRemove={() => removeConstraint(i)}
              />
            ))}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors border border-border px-4 py-2"
          >
            [cancel]
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                saving...
              </>
            ) : (
              "[save]"
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
