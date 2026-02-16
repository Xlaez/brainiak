// src/components/leaderboard/PlayerRow.tsx

import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp } from "lucide-react";
import type { LeaderboardPlayer } from "@/types/leaderboard.types";
import {
  getTierColor,
  getTierName,
  getCountryFlag,
  formatNumber,
  formatPercentage,
} from "@/lib/profile.utils";

interface PlayerRowProps {
  player: LeaderboardPlayer;
  isCurrentUser: boolean;
  delay?: number;
}

export function PlayerRow({
  player,
  isCurrentUser,
  delay = 0,
}: PlayerRowProps) {
  const getRankBadge = () => {
    if (player.rank === 1) {
      return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
    }
    if (player.rank === 2) {
      return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
    }
    if (player.rank === 3) {
      return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
    }
    return "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        rounded-xl p-4 transition-all duration-200
        ${
          isCurrentUser
            ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 shadow-md"
            : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0 ${getRankBadge()} shadow-sm`}
        >
          {player.rank}
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br ${getTierColor(player.tier)} ring-2 ring-white dark:ring-slate-900`}
          >
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                {player.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white truncate">
              {player.username}
            </span>

            <span className="text-lg">{getCountryFlag(player.country)}</span>

            {isCurrentUser && (
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-500 text-white">
                YOU
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {/* Tier */}
            <div className="flex items-center gap-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-gradient-to-r ${getTierColor(player.tier)}`}
              >
                T{player.tier}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs truncate">
                {getTierName(player.tier)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 pr-2">
          {/* Points */}
          <div className="w-16 sm:w-24 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 font-medium">
                Points
              </span>
            </div>
            <div className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatNumber(player.totalPoints)}
            </div>
          </div>

          {/* Games */}
          <div className="hidden sm:block w-20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Games
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {player.gamesPlayed}
            </div>
          </div>

          {/* Win Rate */}
          <div className="hidden md:block w-24 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                W/R
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatPercentage(player.winRate)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
