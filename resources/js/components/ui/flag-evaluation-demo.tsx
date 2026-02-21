import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const evaluations = [
  {
    flag: "new_checkout",
    context: '{ userId: "42" }',
    strategy: "percentage_rollout (80%)",
    result: true,
  },
  {
    flag: "dark_mode",
    context: '{ userId: "107" }',
    strategy: "user_id IN allowlist",
    result: true,
  },
  {
    flag: "beta_search",
    context: '{ userId: "255" }',
    strategy: "ip_range 10.0.0.0/8",
    result: false,
  },
  {
    flag: "v2_api",
    context: '{ userId: "891" }',
    strategy: "gradual_rollout (30%)",
    result: false,
  },
];

export function FlagEvaluationDemo() {
  const [evalIndex, setEvalIndex] = useState(0);
  const [phase, setPhase] = useState(0); // 0=request, 1=evaluating, 2=result

  const evaluation = evaluations[evalIndex];

  useEffect(() => {
    setPhase(0);

    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 1900);
    const t3 = setTimeout(() => {
      setEvalIndex((prev) => (prev + 1) % evaluations.length);
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [evalIndex]);

  return (
    <div className="bg-card border border-border w-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-xs text-muted-foreground">$ evaluate</span>
      </div>

      <div className="p-4 min-h-[8.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={evalIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {/* Flag name */}
            <div className="text-xs text-muted-foreground">
              <span className="text-muted-foreground/40">flag:</span>{" "}
              <span className="text-foreground">{evaluation.flag}</span>
            </div>

            {/* Context */}
            <div className="text-xs text-muted-foreground">
              <span className="text-muted-foreground/40">ctx:</span>{" "}
              <span className="text-muted-foreground/80">
                {evaluation.context}
              </span>
            </div>

            {/* Strategy - phase 1+ */}
            <AnimatePresence>
              {phase >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-muted-foreground"
                >
                  <span className="text-muted-foreground/40">strategy:</span>{" "}
                  {evaluation.strategy}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading dots - phase 1 only */}
            {phase === 1 && (
              <div className="flex items-center gap-1 pt-1">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      delay: dot * 0.12,
                    }}
                    className="w-1 h-1 rounded-full bg-primary"
                  />
                ))}
              </div>
            )}

            {/* Result - phase 2 */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                  className="text-xs pt-2 border-t border-border mt-2"
                >
                  <span className="text-muted-foreground/40">result:</span>{" "}
                  <span
                    className={`font-semibold ${
                      evaluation.result
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {evaluation.result ? "\u25CF [ENABLED]" : "\u25CB [DISABLED]"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
