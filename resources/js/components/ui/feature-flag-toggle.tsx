import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const flags = [
  { name: "dark-mode", label: "Dark Mode", iconOn: "\u{1f319}", iconOff: "\u{2600}\u{fe0f}" },
  { name: "new-checkout", label: "New Checkout", iconOn: "\u{1f6d2}", iconOff: "\u{1f6d2}" },
  { name: "beta-search", label: "Beta Search", iconOn: "\u{1f50d}", iconOff: "\u{1f50d}" },
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
      <div className="relative bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-lg w-[220px]">
        {/* Flag name */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          <AnimatePresence mode="wait">
            <motion.span
              key={flag.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-mono text-muted-foreground"
            >
              {flag.name}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Toggle track */}
        <div className="flex items-center justify-between gap-3">
          <motion.div
            className="relative w-12 h-7 rounded-full cursor-default flex items-center px-1"
            animate={{
              backgroundColor: enabled
                ? "oklch(0.8871 0.2122 128.5041)"
                : "oklch(0.7 0.02 260)",
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-white shadow-md"
              animate={{ x: enabled ? 18 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.div>

          {/* Status text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={enabled ? "on" : "off"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-sm">{enabled ? flag.iconOn : flag.iconOff}</span>
              <span
                className={`text-xs font-semibold tracking-wide uppercase ${
                  enabled ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {enabled ? "ON" : "OFF"}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtle glow when active */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: enabled
              ? "0 0 30px oklch(0.8871 0.2122 128.5041 / 0.15)"
              : "0 0 0px transparent",
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
