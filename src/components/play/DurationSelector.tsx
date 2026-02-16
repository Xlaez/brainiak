import { motion } from "framer-motion";
import type { Duration } from "@/types/play.types";
import { DURATIONS } from "@/types/play.types";

interface DurationSelectorProps {
  selected: Duration | null;
  onSelect: (duration: Duration) => void;
}

export function DurationSelector({
  selected,
  onSelect,
}: DurationSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        Game Duration
      </label>

      <div className="grid grid-cols-3 gap-3">
        {DURATIONS.map((duration, index) => (
          <motion.button
            key={duration.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(duration.value as Duration)}
            className={`
              p-4 rounded-2xl font-black text-sm uppercase tracking-wider
              transition-all duration-300 flex flex-col items-center justify-center gap-2
              ${
                selected === duration.value
                  ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20 ring-2 ring-blue-300 dark:ring-blue-700"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-400 dark:hover:ring-slate-500 shadow-sm"
              }
            `}
          >
            <span className="text-3xl">{duration.icon}</span>
            <span>{duration.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
