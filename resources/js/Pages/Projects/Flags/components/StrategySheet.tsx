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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import StrategyParams from "./StrategyParams";
import ConstraintRow, { type ConstraintData } from "./ConstraintRow";
import type { StrategyData } from "./StrategyCard";

const STRATEGY_TYPES = [
  { value: "default", label: "Default (always on)" },
  { value: "gradualRollout", label: "Gradual Rollout" },
  { value: "userWithId", label: "User Targeting" },
  { value: "remoteAddress", label: "IP Filtering" },
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
            {strategy ? "Edit Strategy" : "Add Strategy"}
          </SheetTitle>
          <SheetDescription>
            Configure how this flag is evaluated for the selected environment.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Strategy type</Label>
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
            <Label className="text-sm">Sort order</Label>
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
              <Label className="text-sm">Constraints</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConstraints((prev) => [...prev, emptyConstraint()])
                }
                type="button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
            {constraints.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No constraints. Strategy applies to all users.
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

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
