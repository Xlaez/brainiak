import { motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import type { UserProfile } from "@/types/profile.types";
import {
  getTierInfo,
  getTierColor,
  getTierName,
  formatNumber,
} from "@/lib/profile.utils";

interface TierProgressProps {
  profile: UserProfile;
}

export function TierProgress({ profile }: TierProgressProps) {
  const tierInfo = getTierInfo(profile.totalPoints);
  const isMaxTier = tierInfo.currentTier === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50"
    >
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">
        Tier Progress
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTierColor(tierInfo.currentTier)} flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white dark:ring-slate-900`}
            >
              {tierInfo.currentTier}
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                {getTierName(tierInfo.currentTier)}
              </div>
              <div className="text-xs font-semibold text-slate-400">
                {formatNumber(tierInfo.currentPoints)} TOTAL POINTS
              </div>
            </div>
          </div>

          {!isMaxTier && (
            <div className="flex items-center gap-4">
              <ChevronUp className="w-6 h-6 text-slate-300" />

              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">
                  {getTierName(tierInfo.nextTier)}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  NEXT TIER
                </div>
              </div>

              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTierColor(tierInfo.nextTier)} flex items-center justify-center text-white font-bold text-xl shadow-md opacity-40 ring-4 ring-white dark:ring-slate-900`}
              >
                {tierInfo.nextTier}
              </div>
            </div>
          )}
        </div>

        {!isMaxTier ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">
                Progress to Tier {tierInfo.nextTier}
              </span>
              <span className="text-blue-500">
                {formatNumber(tierInfo.pointsToNextTier)} POINTS NEEDED
              </span>
            </div>

            <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierInfo.progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${getTierColor(tierInfo.nextTier)} rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
              />
            </div>

            <div className="text-[10px] font-bold text-slate-400 text-right uppercase">
              {tierInfo.progressPercentage.toFixed(1)}% COMPLETE
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-wider">
              Maximum Tier Legend
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">
              You've officially conquered the hierarchy
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
