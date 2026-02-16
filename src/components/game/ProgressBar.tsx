// src/components/game/ProgressBar.tsx

import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em]">
        <span className="text-slate-500 dark:text-slate-500">
          Neural Progress
        </span>
        <span className="text-slate-900 dark:text-white tabular-nums">
          {current} <span className="text-slate-400 font-medium">/</span>{" "}
          {total}
        </span>
      </div>

      <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-[2px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]"
        />
      </div>
    </div>
  );
}
