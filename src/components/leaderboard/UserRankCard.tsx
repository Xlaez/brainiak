import { motion } from "framer-motion";
import { TrendingUp, Users, Award } from "lucide-react";
import type { UserRankInfo } from "@/types/leaderboard.types";
import { formatNumber } from "@/lib/profile.utils";

interface UserRankCardProps {
  rankInfo: UserRankInfo;
  userPoints: number;
}

export function UserRankCard({ rankInfo, userPoints }: UserRankCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl sticky bottom-4 z-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-lg font-semibold mb-1 opacity-90">
            Your Rank
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl sm:text-4xl font-bold tabular-nums">
              #{formatNumber(rankInfo.rank)}
            </div>

            <div className="text-[10px] sm:text-sm opacity-90">
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatNumber(userPoints)} points</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Top {rankInfo.percentile}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center hidden sm:block">
          <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 opacity-75 mb-1 mx-auto" />
          <p className="text-xs sm:text-sm opacity-90">Keep climbing! 💪</p>
        </div>
      </div>
    </motion.div>
  );
}
