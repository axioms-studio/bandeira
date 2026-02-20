import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const OPERATORS = [
  "IN",
  "NOT_IN",
  "STR_CONTAINS",
  "STR_STARTS_WITH",
  "STR_ENDS_WITH",
  "NUM_EQ",
  "NUM_GT",
  "NUM_GTE",
  "NUM_LT",
  "NUM_LTE",
  "DATE_AFTER",
  "DATE_BEFORE",
] as const;

export interface ConstraintData {
  context_name: string;
  operator: string;
  values: string[];
  inverted: boolean;
  case_insensitive: boolean;
}

interface Props {
  constraint: ConstraintData;
  onChange: (c: ConstraintData) => void;
  onRemove: () => void;
}

export default function ConstraintRow({ constraint, onChange, onRemove }: Props) {
  return (
    <div className="border border-border p-3 space-y-3 bg-muted/30">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Context name (e.g. userId, companyId)"
            value={constraint.context_name}
            onChange={(e) =>
              onChange({ ...constraint, context_name: e.target.value })
            }
            className="h-9 text-sm"
          />
          <Select
            value={constraint.operator}
            onValueChange={(v) => onChange({ ...constraint, operator: v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op} value={op}>
                  {op.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Values (comma-separated)"
            value={constraint.values.join(", ")}
            onChange={(e) =>
              onChange({
                ...constraint,
                values: e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
            className="h-9 text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onRemove}
          type="button"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={constraint.inverted}
            onCheckedChange={(checked) =>
              onChange({ ...constraint, inverted: checked === true })
            }
          />
          Inverted
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={constraint.case_insensitive}
            onCheckedChange={(checked) =>
              onChange({ ...constraint, case_insensitive: checked === true })
            }
          />
          Case insensitive
        </label>
      </div>
    </div>
  );
}
