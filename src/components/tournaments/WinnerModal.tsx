// src/components/tournaments/WinnerModal.tsx

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, Home, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tournament } from "@/types/tournament.types";
import { useAuthStore } from "@/stores/authStore";
import { formatNumber } from "@/lib/profile.utils";
import { useNavigate } from "@tanstack/react-router";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import confetti from "canvas-confetti";

interface WinnerModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
}

export function WinnerModal({ tournament, isOpen, onClose }: WinnerModalProps) {
  const profile = useAuthStore((state) => state.profile);
  const navigate = useNavigate();

  const sortedStandings = [...tournament.standings].sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  const winner = sortedStandings[0];
  const isWinner = winner.userId === profile?.userId;

  // Confetti effect
  useEffect(() => {
    if (isOpen && isWinner) {
      const duration = 5000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#3B82F6"],
          zIndex: 9999,
        });

        confetti({
          particleCount: 5,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#3B82F6"],
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen, isWinner]);

  const handleShare = async () => {
    const text = isWinner
      ? `🏆 I won the "${tournament.name}" tournament on Brainiak!`
      : `Just completed the "${tournament.name}" tournament on Brainiak!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Brainiak Tournament Results",
          text,
          url: window.location.origin + `/tournaments/${tournament.$id}`,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `${text}\n${window.location.origin}/tournaments/${tournament.$id}`,
        );
        alert("Results copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-hidden"
          onClick={onClose}
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[40px] p-8 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>

            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-block relative mb-4"
              >
                <div className="text-8xl">{isWinner ? "👑" : "🏆"}</div>
                {isWinner && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 text-4xl"
                  >
                    ✨
                  </motion.div>
                )}
              </motion.div>

              <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
                {isWinner ? "Legendary Victory!" : "Tournament Complete!"}
              </h2>

              <p className="text-lg text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 inline-block px-6 py-2 rounded-full">
                {tournament.name}
              </p>
            </div>

            {/* Top 3 Podium */}
            <div className="mb-12">
              <div className="flex items-end justify-center gap-4 py-8 relative">
                {/* 2nd Place */}
                {sortedStandings[1] && (
                  <PodiumPlayer
                    player={sortedStandings[1]}
                    rank={2}
                    height="h-32"
                    tournament={tournament}
                  />
                )}

                {/* 1st Place */}
                {sortedStandings[0] && (
                  <PodiumPlayer
                    player={sortedStandings[0]}
                    rank={1}
                    height="h-44"
                    tournament={tournament}
                  />
                )}

                {/* 3rd Place */}
                {sortedStandings[2] && (
                  <PodiumPlayer
                    player={sortedStandings[2]}
                    rank={3}
                    height="h-24"
                    tournament={tournament}
                  />
                )}
              </div>
            </div>

            {/* Full Standings */}
            <div className="mb-10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Final Standings
              </h3>

              <div className="space-y-2">
                {sortedStandings.map((standing, index) => {
                  const rank = index + 1;
                  const participant = tournament.participants.find(
                    (p) => p.userId === standing.userId,
                  );
                  const isMe = standing.userId === profile?.userId;

                  return (
                    <div
                      key={standing.userId}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        isMe
                          ? "bg-blue-500/10 ring-1 ring-blue-500/50"
                          : "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-400 text-sm">
                        {rank}
                      </div>

                      <ProfileAvatar
                        username={standing.username}
                        avatarUrl={participant?.avatarUrl}
                        tier={participant?.tier || 10}
                        size="sm"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                          {standing.username}
                          {isMe && (
                            <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {standing.wins}W - {standing.losses}L -{" "}
                          {standing.draws}D
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-xl text-slate-900 dark:text-white tabular-nums tracking-tighter">
                          {formatNumber(standing.totalPoints)}
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          points
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-14 rounded-2xl font-black uppercase tracking-widest border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Share2 className="w-5 h-5 mr-3" />
                Share
              </Button>

              <Button
                onClick={() => navigate({ to: "/play" })}
                className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
              >
                <PlayCircle className="w-5 h-5 mr-3" />
                Play Again
              </Button>

              <Button
                onClick={() => navigate({ to: "/dashboard" })}
                variant="ghost"
                className="h-14 col-span-2 rounded-2xl font-black uppercase tracking-widest text-slate-500"
              >
                <Home className="w-5 h-5 mr-3" />
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PodiumPlayerProps {
  player: any;
  rank: 1 | 2 | 3;
  height: string;
  tournament: Tournament;
}

function PodiumPlayer({ player, rank, height, tournament }: PodiumPlayerProps) {
  const participant = tournament.participants.find(
    (p) => p.userId === player.userId,
  );

  const gradients = {
    1: "from-yellow-400 via-yellow-500 to-yellow-600",
    2: "from-slate-300 via-slate-400 to-slate-500",
    3: "from-orange-400 via-orange-500 to-orange-600",
  };

  const trophies = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  const scale = rank === 1 ? "scale-110 z-10" : "scale-90 opacity-80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: rank * 0.2, type: "spring" }}
      className={`flex flex-col items-center ${scale}`}
    >
      {/* Avatar Section */}
      <div className="relative mb-4">
        <div
          className={`relative p-1 rounded-full bg-gradient-to-br ${gradients[rank]} shadow-2xl`}
        >
          <div className="bg-white dark:bg-slate-900 p-1 rounded-full">
            <ProfileAvatar
              username={player.username}
              avatarUrl={participant?.avatarUrl}
              tier={participant?.tier || 10}
              size="xl"
            />
          </div>
        </div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-4 -right-4 text-5xl drop-shadow-lg"
        >
          {trophies[rank]}
        </motion.div>
      </div>

      {/* Player Display */}
      <div className="text-center mb-4">
        <div className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[120px]">
          {player.username}
        </div>
        <div className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">
          {formatNumber(player.totalPoints)} PTS
        </div>
      </div>

      {/* Podium Block */}
      <div
        className={`${height} w-28 bg-gradient-to-b ${gradients[rank]} rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex flex-col items-center justify-start pt-4 relative overflow-hidden`}
      >
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-white/30 blur-sm" />

        <span className="text-6xl font-black text-white/40 italic select-none">
          {rank}
        </span>
        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mt-1 italic">
          PLACE
        </span>
      </div>
    </motion.div>
  );
}
