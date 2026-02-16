// src/components/tournaments/TournamentStandings.tsx

import { Trophy } from "lucide-react";
import type { Tournament } from "@/types/tournament.types";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

interface TournamentStandingsProps {
  tournament: Tournament;
}

export function TournamentStandings({ tournament }: TournamentStandingsProps) {
  // Sort standings by points
  const sortedStandings = [...tournament.standings].sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Standings
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <th className="pb-3 pr-4">Rank</th>
              <th className="pb-3 pr-4">Player</th>
              <th className="pb-3 pr-4 text-center">W</th>
              <th className="pb-3 pr-4 text-center">D</th>
              <th className="pb-3 pr-4 text-center">L</th>
              <th className="pb-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sortedStandings.map((standing, index) => {
              const participant = tournament.participants.find(
                (p) => p.userId === standing.userId,
              );
              return (
                <tr key={standing.userId} className="text-sm">
                  <td className="py-4 font-bold text-slate-700 dark:text-slate-300">
                    #{index + 1}
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <ProfileAvatar
                        username={standing.username}
                        avatarUrl={participant?.avatarUrl}
                        tier={participant?.tier}
                        size="sm"
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {standing.username}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-center font-medium text-slate-600 dark:text-slate-400">
                    {standing.wins}
                  </td>
                  <td className="py-4 pr-4 text-center font-medium text-slate-600 dark:text-slate-400">
                    {standing.draws}
                  </td>
                  <td className="py-4 pr-4 text-center font-medium text-slate-600 dark:text-slate-400">
                    {standing.losses}
                  </td>
                  <td className="py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                    {standing.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
