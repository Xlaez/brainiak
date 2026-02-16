// src/components/tournaments/TournamentStandings.tsx

import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Tournament } from "@/types/tournament.types";
import { useAuthStore } from "@/stores/authStore";
import { formatNumber } from "@/lib/profile.utils";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

interface TournamentStandingsProps {
  tournament: Tournament;
}

export function TournamentStandings({ tournament }: TournamentStandingsProps) {
  const profile = useAuthStore((state) => state.profile);

  // Sort standings by total points (descending)
  const sortedStandings = [...tournament.standings].sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-500/20";
    }
    if (rank === 2) {
      return "bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-2 ring-gray-300/50";
    }
    if (rank === 3) {
      return "bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-2 ring-orange-400/50";
    }
    return "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30">
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        Live Standings
      </h3>

      <div className="space-y-3">
        {sortedStandings.map((standing, index) => {
          const rank = index + 1;
          const participant = tournament.participants.find(
            (p) => p.userId === standing.userId,
          );
          const isCurrentUser = standing.userId === profile?.userId;

          return (
            <motion.div
              key={standing.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-4 rounded-2xl transition-all duration-300 group
                ${
                  isCurrentUser
                    ? "bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500 shadow-xl shadow-blue-500/10"
                    : "bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700"
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 text-sm ${getRankBadge(rank)}`}
                >
                  {getRankIcon(rank) || rank}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <ProfileAvatar
                    username={standing.username}
                    avatarUrl={participant?.avatarUrl}
                    tier={participant?.tier || 10}
                    size="md"
                    showTierBadge
                  />
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                      {standing.username}
                    </span>

                    {isCurrentUser && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500 text-white uppercase tracking-widest">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="w-3 h-3 stroke-[3]" />
                      {standing.wins}W
                    </span>

                    <span className="flex items-center gap-1 text-red-500">
                      <TrendingDown className="w-3 h-3 stroke-[3]" />
                      {standing.losses}L
                    </span>

                    {standing.draws > 0 && (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Minus className="w-3 h-3 stroke-[3]" />
                        {standing.draws}D
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                    {formatNumber(standing.totalPoints)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    points
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
