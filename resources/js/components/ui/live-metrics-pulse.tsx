import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const metrics = [
  { label: "evaluations", target: 12847, max: 20000, format: "int" as const },
  { label: "flags_active", target: 24, max: 42, format: "frac" as const, denominator: 42 },
  { label: "avg_latency", target: 0.3, max: 10, format: "ms" as const },
  { label: "uptime", target: 99.97, max: 100, format: "pct" as const },
];

function formatValue(value: number, format: string, denominator?: number): string {
  switch (format) {
    case "int":
      return Math.round(value).toLocaleString();
    case "frac":
      return `${Math.round(value)}/${denominator}`;
    case "ms":
      return `${value.toFixed(1)}ms`;
    case "pct":
      return `${value.toFixed(2)}%`;
    default:
      return String(value);
  }
}

function AnimatedCounter({
  target,
  format,
  denominator,
  shouldAnimate,
}: {
  target: number;
  format: string;
  denominator?: number;
  shouldAnimate: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    const duration = 1600;
    const steps = 40;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      // Ease-out cubic
      const t = step / steps;
      const eased = 1 - Math.pow(1 - t, 3);
      const current = target * eased;

      if (step >= steps) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(current);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [target, shouldAnimate]);

  return (
    <span className="text-[10px] text-foreground font-medium tabular-nums">
      {formatValue(value, format, denominator)}
    </span>
  );
}

export function LiveMetricsPulse() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="bg-card border border-border w-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
        <span className="text-xs text-muted-foreground">live_metrics</span>
      </div>

      <div className="p-4 space-y-3.5">
        {metrics.map((metric, i) => (
          <div key={metric.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-muted-foreground/60">
                {metric.label}
              </span>
              <AnimatedCounter
                target={metric.target}
                format={metric.format}
                denominator={metric.denominator}
                shouldAnimate={isInView}
              />
            </div>
            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "oklch(0.8871 0.2122 128.5041)",
                  boxShadow:
                    "0 0 4px oklch(0.8871 0.2122 128.5041 / 0.4)",
                }}
                initial={{ width: 0 }}
                animate={
                  isInView
                    ? { width: `${(metric.target / metric.max) * 100}%` }
                    : { width: 0 }
                }
                transition={{
                  duration: 1.4,
                  delay: 0.15 + i * 0.12,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
