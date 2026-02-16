import { motion } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import type { PlayerState } from "@/types/game.types";

import { getTierColor } from "@/lib/profile.utils";

interface PlayerCardProps {
  player: PlayerState;
  isCurrentUser: boolean;
  isActive: boolean; // Currently answering
}

export function PlayerCard({
  player,
  isCurrentUser,
  isActive,
}: PlayerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md dark:shadow-xl
        ring-1 transition-all duration-300
        ${
          isActive
            ? "ring-2 ring-blue-500 shadow-lg dark:shadow-2xl"
            : "ring-slate-200/30 dark:ring-slate-700/30"
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`
            w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br
            ${getTierColor(player.tier)} ring-2 ring-white dark:ring-slate-900
          `}
          >
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                {player.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Activity Indicator (Answered Status) */}
          {player.hasAnswered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                flex items-center justify-center text-white text-[10px]
                ${player.isCorrect ? "bg-green-500" : player.isCorrect === false ? "bg-red-500" : "bg-blue-500"}
                ring-2 ring-white dark:ring-slate-900
              `}
            >
              {player.isCorrect
                ? "✓"
                : player.isCorrect === false
                  ? "✗"
                  : "..."}
            </motion.div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">
              {player.username}
              {isCurrentUser && (
                <span className="ml-2 text-[10px] text-blue-500 font-normal uppercase tracking-wider">
                  (You)
                </span>
              )}
            </h3>

            {/* Tier Badge */}
            <span
              className={`
                px-2 py-0.5 rounded-full text-[10px] font-bold text-white
                bg-gradient-to-r ${getTierColor(player.tier)}
              `}
            >
              T{player.tier}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {/* Score */}
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {player.score}
              </span>
            </div>

            {/* Streak */}
            {player.streak > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
                <span className="font-bold text-orange-500">
                  {player.streak}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
