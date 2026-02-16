import { motion } from "framer-motion";
import { Loader2, PieChart } from "lucide-react";
import type { SubjectPerformance } from "@/types/profile.types";
import {
  getSubjectIcon,
  getSubjectDisplayName,
  formatPercentage,
} from "@/lib/profile.utils";

interface SubjectBreakdownProps {
  performance: SubjectPerformance[];
  isLoading: boolean;
}

export function SubjectBreakdown({
  performance,
  isLoading,
}: SubjectBreakdownProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!performance || performance.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-10 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
          <PieChart className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          No Subject Data
        </h3>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Play in different subjects to see performance
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50"
    >
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-8">
        Subject Performance
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {performance.map((item, index) => (
          <div key={item.subject} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSubjectIcon(item.subject)}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  {getSubjectDisplayName(item.subject)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  {formatPercentage(item.winRate)}
                </span>
              </div>
            </div>

            <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.winRate}%` }}
                transition={{ duration: 0.8, delay: 0.7 + index * 0.05 }}
                className={`h-full rounded-full ${
                  item.winRate >= 70
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                    : item.winRate >= 50
                      ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                      : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{item.gamesPlayed} GAMES PLAYED</span>
              <span>
                {item.gamesWon} WINS • {item.gamesLost} LOSSES
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
