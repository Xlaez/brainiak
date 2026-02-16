import { motion } from "framer-motion";
import { Check, Clock, Play, Trophy } from "lucide-react";
import type { Tournament, TournamentMatch } from "@/types/tournament.types";

interface MatchQueueProps {
  tournament: Tournament;
  userId: string;
}

export function MatchQueue({ tournament, userId }: MatchQueueProps) {
  // Get matches for this user
  const userMatches = tournament.matches.filter(
    (m) => m.player1Id === userId || m.player2Id === userId,
  );

  // Get opponent username
  const getOpponentUsername = (match: TournamentMatch) => {
    const opponentId =
      match.player1Id === userId ? match.player2Id : match.player1Id;
    const opponent = tournament.participants.find(
      (p) => p.userId === opponentId,
    );
    return opponent?.username || "Unknown";
  };

  const getMatchStatusIcon = (status: string) => {
    if (status === "completed")
      return <Check className="w-4 h-4 text-green-500" />;
    if (status === "active")
      return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getMatchStatusColor = (status: string) => {
    if (status === "completed")
      return "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800";
    if (status === "active")
      return "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500";
    return "bg-slate-50 dark:bg-slate-900/50";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Your Matches (
        {userMatches.filter((m) => m.status === "completed").length}/
        {userMatches.length})
      </h3>

      <div className="space-y-2">
        {userMatches.map((match, index) => (
          <motion.div
            key={match.matchId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl transition-all duration-200 ${getMatchStatusColor(match.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getMatchStatusIcon(match.status)}

                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Match {index + 1} vs {getOpponentUsername(match)}
                  </div>

                  {match.status === "completed" && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Score:{" "}
                      {match.player1Id === userId
                        ? match.player1Score
                        : match.player2Score}{" "}
                      -{" "}
                      {match.player1Id === userId
                        ? match.player2Score
                        : match.player1Score}
                      {match.winnerId === userId && (
                        <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                          Won!
                        </span>
                      )}
                      {match.winnerId && match.winnerId !== userId && (
                        <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                          Lost
                        </span>
                      )}
                      {match.winnerId === null && (
                        <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                          Draw
                        </span>
                      )}
                    </div>
                  )}

                  {match.status === "active" && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      In Progress
                    </div>
                  )}

                  {match.status === "pending" && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Upcoming
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
