import { motion } from "framer-motion";
import type { RecentMatch } from "@/types/profile.types";

interface PerformanceChartProps {
  matches: RecentMatch[];
}

export function PerformanceChart({ matches }: PerformanceChartProps) {
  // Simple visualization of last matches results
  // Red for loss, Green for win, Yellow for draw

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
        Performance Trend
      </h2>

      <div className="flex items-end gap-1.5 h-24">
        {matches
          .slice(0, 20)
          .reverse()
          .map((match, i) => (
            <motion.div
              key={match.matchId}
              initial={{ height: 0 }}
              animate={{ height: match.result === "draw" ? "50%" : "100%" }}
              transition={{ delay: i * 0.03 }}
              className={`flex-1 rounded-t-sm ${
                match.result === "won"
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]"
                  : match.result === "lost"
                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                    : "bg-amber-500"
              }`}
              title={`${match.result.toUpperCase()} - ${match.userScore}:${match.opponentScore}`}
            />
          ))}
        {matches.length < 20 &&
          Array.from({ length: 20 - matches.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex-1 h-2 bg-slate-100 dark:bg-slate-900 rounded-t-sm"
            />
          ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Earliest</span>
        <span>Last 20 Matches</span>
        <span>Latest</span>
      </div>
    </div>
  );
}
