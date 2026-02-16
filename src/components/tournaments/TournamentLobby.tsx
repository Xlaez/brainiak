import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, PlayCircle, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tournament, TournamentMatch } from "@/types/tournament.types";
import { useAuthStore } from "@/stores/authStore";
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { TournamentService } from "@/services/tournament.service";
import { useNavigate } from "@tanstack/react-router";
import {
  getTierColor,
  getSubjectDisplayName,
  getSubjectIcon,
} from "@/lib/profile.utils";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { MatchQueue } from "./MatchQueue";
import { Progress } from "../ui/progress";
import { toast } from "sonner";

interface TournamentLobbyProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function TournamentLobby({
  tournament,
  onRefresh,
}: TournamentLobbyProps) {
  const profile = useAuthStore((state) => state.profile);
  const navigate = useNavigate();
  const [nextMatch, setNextMatch] = useState<TournamentMatch | null>(null);

  // Subscribe to tournament updates
  useEffect(() => {
    if (!tournament.$id) return;

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.TOURNAMENTS}.documents.${tournament.$id}`,
      (response) => {
        console.log("Tournament update:", response.payload);
        onRefresh();
      },
    );

    return () => {
      unsubscribe();
    };
  }, [tournament.$id, onRefresh]);

  // Load player's next match
  useEffect(() => {
    if (!profile || tournament.status !== "active") return;

    const loadNextMatch = async () => {
      const match = await TournamentService.getPlayerNextMatch(
        tournament.$id,
        profile.userId,
      );
      setNextMatch(match);
    };

    loadNextMatch();
  }, [tournament, profile]);

  // Navigate to active match
  useEffect(() => {
    if (!nextMatch || !profile) return;

    if (nextMatch.status === "active" && nextMatch.gameRoomId) {
      // Check if this player is in this match
      if (
        nextMatch.player1Id === profile.userId ||
        nextMatch.player2Id === profile.userId
      ) {
        // Navigate to game room
        navigate({ to: `/game/${nextMatch.gameRoomId}` });
      }
    }
  }, [nextMatch, profile, navigate]);

  const handleResumeMatch = async () => {
    if (!nextMatch || !tournament.$id) return;

    try {
      await TournamentService.resumeMatch(tournament.$id, nextMatch.matchId);
      toast.success("Match verified! Please wait...");
      setTimeout(onRefresh, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to resume match");
    }
  };

  const progress = TournamentService.getTournamentProgress(tournament);

  return (
    <div className="space-y-6">
      {/* Tournament Status Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tournament.name}
          </h2>

          <div className="flex items-center gap-2">
            {tournament.status === "waiting" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                WAITING FOR PLAYERS
              </span>
            )}

            {tournament.status === "active" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white animate-pulse">
                ACTIVE
              </span>
            )}

            {tournament.status === "completed" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                COMPLETED
              </span>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tournament.subjects.map((subject) => (
            <div
              key={subject}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-sm"
            >
              <span>{getSubjectIcon(subject)}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {getSubjectDisplayName(subject)}
              </span>
            </div>
          ))}
        </div>

        {/* Progress (for active tournaments) */}
        {tournament.status === "active" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Tournament Progress
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {progress.completedMatches} / {progress.totalMatches} matches
              </span>
            </div>

            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Participants ({tournament.participants.length}/6)
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {tournament.participants.map((participant) => (
            <motion.div
              key={participant.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"
            >
              {/* Avatar */}
              <ProfileAvatar
                username={participant.username}
                avatarUrl={participant.avatarUrl}
                tier={participant.tier}
                size="md"
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {participant.username}
                  </span>

                  {participant.userId === tournament.creatorId && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500 text-white">
                      HOST
                    </span>
                  )}

                  {participant.userId === profile?.userId && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500 text-white">
                      YOU
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold text-white bg-gradient-to-r ${getTierColor(participant.tier)}`}
                  >
                    Tier {participant.tier}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: 6 - tournament.participants.length }).map(
            (_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700"
              >
                <span className="text-sm text-slate-400">
                  Waiting for player...
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Waiting Status */}
      {tournament.status === "waiting" && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Waiting for Players</h3>
          <p className="text-blue-100">
            Tournament will start automatically when all 6 players have joined
          </p>
          <p className="text-sm text-blue-200 mt-2">
            {6 - tournament.participants.length} more player(s) needed
          </p>
        </div>
      )}

      {/* Active Match Info */}
      {tournament.status === "active" && nextMatch && profile && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PlayCircle className="w-6 h-6" />
              {nextMatch.status === "active"
                ? "Your Match is Ready!"
                : "Your Next Match"}
            </h3>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm mb-4">
            <div className="flex items-center justify-center gap-4 text-lg font-semibold">
              <span>
                {
                  tournament.participants.find(
                    (p) => p.userId === nextMatch.player1Id,
                  )?.username
                }
              </span>
              <span className="text-2xl">VS</span>
              <span>
                {
                  tournament.participants.find(
                    (p) => p.userId === nextMatch.player2Id,
                  )?.username
                }
              </span>
            </div>
          </div>

          {nextMatch.status === "active" && nextMatch.gameRoomId && (
            <Button
              onClick={() => navigate({ to: `/game/${nextMatch.gameRoomId}` })}
              className="w-full bg-white hover:bg-gray-100 text-green-600 font-bold py-4 rounded-xl text-lg"
            >
              Join Match Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          {nextMatch.status === "active" && !nextMatch.gameRoomId && (
            <Button
              onClick={handleResumeMatch}
              className="w-full bg-white hover:bg-gray-100 text-green-600 font-bold py-4 rounded-xl text-lg animate-pulse"
            >
              Match Ready - Click to Enter
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          {nextMatch.status === "pending" && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-green-100">
                Waiting for previous matches to complete...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Match Queue */}
      {tournament.status === "active" && profile && (
        <MatchQueue tournament={tournament} userId={profile.userId} />
      )}
    </div>
  );
}
