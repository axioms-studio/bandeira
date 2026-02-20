import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const flags = [
  { name: "dark-mode", label: "dark_mode" },
  { name: "new-checkout", label: "new_checkout" },
  { name: "beta-search", label: "beta_search" },
];

export function FeatureFlagToggle() {
  const [enabled, setEnabled] = useState(true);
  const [flagIndex, setFlagIndex] = useState(0);

  const flag = flags[flagIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setEnabled((prev) => {
        if (prev) return false;
        setFlagIndex((i) => (i + 1) % flags.length);
        return true;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.8, ease: [0.25, 0.4, 0.25, 1] }}
      className="inline-flex flex-col items-center gap-3"
    >
      <div className="relative bg-card border border-border p-5 w-[260px]">
        {/* Flag name */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-muted-foreground/40"
            }`}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={flag.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-muted-foreground"
            >
              $ {flag.label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Toggle display */}
        <div className="flex items-center justify-between gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={enabled ? "on" : "off"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {enabled ? (
                <span className="text-primary font-semibold text-sm">
                  ● [ON]
                </span>
              ) : (
                <span className="text-muted-foreground font-semibold text-sm">
                  ○ [OFF]
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          <span className="text-xs text-muted-foreground">
            // {enabled ? "enabled" : "disabled"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
