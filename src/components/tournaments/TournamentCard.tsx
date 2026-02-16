import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tournament } from "@/types/tournament.types";
import { getSubjectDisplayName, getSubjectIcon } from "@/lib/profile.utils";
import { useAuthStore } from "@/stores/authStore";
import { useJoinTournament } from "@/hooks/useTournaments";
import { useNavigate } from "@tanstack/react-router";

interface TournamentCardProps {
  tournament: Tournament;
  delay?: number;
}

export function TournamentCard({ tournament, delay = 0 }: TournamentCardProps) {
  const profile = useAuthStore((state) => state.profile);
  const navigate = useNavigate();
  const joinTournament = useJoinTournament();

  const isParticipant = tournament.participants.some(
    (p) => p.userId === profile?.userId,
  );
  const isFull = tournament.participants.length >= 6;
  const canJoin = !isParticipant && !isFull && tournament.status === "waiting";

  const getStatusBadge = () => {
    const badges = {
      waiting: "bg-gradient-to-r from-blue-500 to-blue-600",
      active: "bg-gradient-to-r from-green-500 to-green-600 animate-pulse",
      completed: "bg-gradient-to-r from-slate-500 to-slate-600",
      cancelled: "bg-gradient-to-r from-red-500 to-red-600",
    };

    return badges[tournament.status] || "bg-slate-500";
  };

  const handleClick = () => {
    navigate({ to: `/tournaments/${tournament.$id}` });
  };

  const handleJoin = (e: MouseEvent) => {
    e.stopPropagation();
    joinTournament.mutate(tournament.$id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {tournament.name}
          </h3>

          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>by {tournament.creatorUsername}</span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider ${getStatusBadge()}`}
        >
          {tournament.status}
        </span>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Participants */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">
              Players
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {tournament.participants.length}/6
          </div>
        </div>

        {/* Duration */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">
              Duration
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {Math.floor(tournament.duration / 60)}m
          </div>
        </div>

        {/* Matches */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">
              Matches
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            15
          </div>
        </div>
      </div>

      {/* Participant Avatars */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex -space-x-2">
          {tournament.participants.slice(0, 5).map((participant, index) => (
            <div
              key={participant.userId}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden"
              style={{ zIndex: 5 - index }}
            >
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                participant.username.charAt(0).toUpperCase()
              )}
            </div>
          ))}

          {tournament.participants.length > 5 && (
            <div
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[10px] font-semibold"
              style={{ zIndex: 0 }}
            >
              +{tournament.participants.length - 5}
            </div>
          )}
        </div>

        {/* Created Time */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4">
        {tournament.status === "waiting" && canJoin && (
          <Button
            onClick={handleJoin}
            disabled={joinTournament.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 text-white font-semibold rounded-xl"
          >
            {joinTournament.isPending ? "Joining..." : "Join Tournament"}
          </Button>
        )}

        {isParticipant && tournament.status === "waiting" && (
          <Button
            onClick={handleClick}
            variant="outline"
            className="w-full rounded-xl"
          >
            View Room
          </Button>
        )}

        {tournament.status === "active" && isParticipant && (
          <Button
            onClick={handleClick}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:brightness-110 text-white font-semibold rounded-xl"
          >
            Play Matches
          </Button>
        )}

        {(tournament.status === "completed" ||
          (!canJoin && !isParticipant)) && (
          <Button
            onClick={handleClick}
            variant="outline"
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
          >
            {tournament.status === "completed"
              ? "View Results"
              : "View Details"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
