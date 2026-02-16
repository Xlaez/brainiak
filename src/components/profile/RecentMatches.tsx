import { motion } from "framer-motion";
import { ChevronRight, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "./MatchCard";
import type { RecentMatch } from "@/types/profile.types";

interface RecentMatchesProps {
  matches: RecentMatch[];
  isLoading: boolean;
  onViewAll?: () => void;
}

export function RecentMatches({
  matches,
  isLoading,
  onViewAll,
}: RecentMatchesProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-10 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          No Matches Yet
        </h3>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Start playing to climb the legendary tiers
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Recent Matches
        </h2>

        {matches.length >= 10 && onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="h-8 gap-1 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            View History
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {matches.map((match, index) => (
          <MatchCard
            key={match.matchId}
            match={match}
            delay={0.6 + index * 0.05}
          />
        ))}
      </div>
    </motion.div>
  );
}
