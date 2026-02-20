import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import StrategyCard, { type StrategyData } from "./StrategyCard";
import StrategySheet from "./StrategySheet";
import type { ConstraintData } from "./ConstraintRow";

interface Props {
  projectId: number;
  flagId: number;
  environmentId: number;
  csrfToken: string;
}

export default function StrategyList({
  projectId,
  flagId,
  environmentId,
  csrfToken,
}: Props) {
  const [strategies, setStrategies] = useState<StrategyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StrategyData | null>(null);

  const basePath = `/projects/${projectId}/flags/${flagId}/strategies`;

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${basePath}?env=${environmentId}`, {
        headers: { "X-XSRF-TOKEN": csrfToken },
      });
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [basePath, environmentId, csrfToken]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleSave = async (data: {
    name: string;
    parameters: Record<string, any>;
    sort_order: number;
    constraints: ConstraintData[];
  }) => {
    if (editing) {
      const res = await fetch(`${basePath}/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update strategy");
    } else {
      const res = await fetch(basePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({ ...data, environment_id: environmentId }),
      });
      if (!res.ok) throw new Error("Failed to create strategy");
    }
    await fetchStrategies();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this strategy?")) return;
    const res = await fetch(`${basePath}/${id}`, {
      method: "DELETE",
      headers: { "X-XSRF-TOKEN": csrfToken },
    });
    if (res.ok) {
      setStrategies((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (s: StrategyData) => {
    setEditing(s);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        loading strategies...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {strategies.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            {">"} no strategies configured — flag uses toggle state only
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5"
          >
            [+ add_strategy]
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {strategies.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                onEdit={() => openEdit(s)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5"
          >
            [+ add_strategy]
          </button>
        </>
      )}

      <StrategySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        strategy={editing}
        onSave={handleSave}
      />
    </div>
  );
}
