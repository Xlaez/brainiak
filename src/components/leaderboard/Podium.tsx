// src/components/leaderboard/Podium.tsx

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { LeaderboardPlayer } from "@/types/leaderboard.types";
import {
  getCountryFlag,
  formatNumber,
  getTierColor,
} from "@/lib/profile.utils";

interface PodiumProps {
  players: LeaderboardPlayer[];
}

export function Podium({ players }: PodiumProps) {
  if (players.length === 0) return null;

  // Arrange as: 2nd, 1st, 3rd
  const arranged = [
    players[1], // Silver (left)
    players[0], // Gold (center)
    players[2], // Bronze (right)
  ].filter(Boolean);

  const heights = ["h-32", "h-40", "h-28"]; // Different heights for visual effect
  const positions = [1, 0, 2]; // Original positions for data

  return (
    <div className="mb-8 mt-12">
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-4">
        {arranged.map((player, index) => {
          if (!player) return null;

          const originalIndex = positions[index];
          const rank = originalIndex + 1;

          const gradients = {
            1: "from-yellow-400 to-yellow-600",
            2: "from-gray-300 to-gray-500",
            3: "from-orange-400 to-orange-600",
          };

          const trophies = {
            1: "🏆",
            2: "🥈",
            3: "🥉",
          };

          return (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center flex-1 max-w-[120px] sm:max-w-[160px]"
            >
              {/* Avatar */}
              <div className="relative mb-3">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br ${getTierColor(player.tier)} ring-4 ring-white dark:ring-slate-900 shadow-lg`}
                >
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Trophy Icon */}
                <div className="absolute -top-2 -right-2 text-2xl sm:text-3xl">
                  {trophies[rank as 1 | 2 | 3]}
                </div>
              </div>

              {/* Player Info */}
              <div className="text-center mb-2 px-1">
                <div className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">
                    {player.username}
                  </span>
                  <span className="text-xs sm:text-base">
                    {getCountryFlag(player.country)}
                  </span>
                </div>

                <div className="flex items-center gap-1 justify-center mt-1">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  <span className="text-[10px] sm:text-sm font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatNumber(player.totalPoints)} pts
                  </span>
                </div>
              </div>

              {/* Podium Block */}
              <div
                className={`${heights[index]} w-full bg-gradient-to-br ${gradients[rank as 1 | 2 | 3]} rounded-t-2xl shadow-lg flex items-center justify-center`}
              >
                <span className="text-3xl sm:text-4xl font-bold text-white opacity-50">
                  #{rank}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
