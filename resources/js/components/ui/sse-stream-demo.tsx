import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const sdkClients = ["go_sdk", "js_sdk", "py_sdk"];

const flagUpdates = [
  { flag: "dark_mode", value: true },
  { flag: "new_checkout", value: false },
  { flag: "beta_search", value: true },
  { flag: "v2_api", value: true },
  { flag: "ab_pricing", value: false },
  { flag: "onboarding_v3", value: true },
];

interface LogEntry {
  id: number;
  flag: string;
  value: boolean;
}

export function SSEStreamDemo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeClient, setActiveClient] = useState<number | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const update = flagUpdates[counter.current % flagUpdates.length];
      const clientIdx = counter.current % sdkClients.length;

      setLogs((prev) => [
        { id: counter.current, ...update },
        ...prev.slice(0, 2),
      ]);
      setActiveClient(clientIdx);
      counter.current++;

      const reset = setTimeout(() => setActiveClient(null), 900);
      return () => clearTimeout(reset);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border w-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
        <span className="text-xs text-muted-foreground">sse_stream</span>
      </div>

      <div className="p-4">
        {/* Server → Clients */}
        <div className="flex items-center gap-3 mb-4">
          {/* Server node */}
          <div className="shrink-0 border border-primary/30 px-2.5 py-2">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[10px] text-primary font-medium"
            >
              bandeira
            </motion.div>
          </div>

          {/* Stream lines */}
          <div className="flex-1 flex flex-col gap-2.5">
            {sdkClients.map((client, i) => (
              <div key={client} className="flex items-center gap-2">
                <div className="flex-1 relative h-px bg-border overflow-hidden">
                  <AnimatePresence>
                    {activeClient === i && (
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 h-[2px] w-6 rounded-full"
                        style={{
                          background: "oklch(0.8871 0.2122 128.5041)",
                          boxShadow:
                            "0 0 8px oklch(0.8871 0.2122 128.5041 / 0.6), 0 0 16px oklch(0.8871 0.2122 128.5041 / 0.3)",
                        }}
                        initial={{ left: "-10%", opacity: 0 }}
                        animate={{ left: "110%", opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: "linear" }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={`text-[10px] shrink-0 transition-colors duration-200 ${
                    activeClient === i
                      ? "text-primary"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {client}
                </span>
                <span
                  className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                    activeClient === i ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Event log */}
        <div className="border-t border-border pt-3 min-h-[3.5rem]">
          <AnimatePresence initial={false}>
            {logs.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="text-[10px] text-muted-foreground/60 leading-5"
              >
                <span className="text-primary/60">{">"}</span> flag.
                {entry.flag}{" "}
                <span className={entry.value ? "text-primary/70" : ""}>
                  {entry.value ? "ON" : "OFF"}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
