// src/components/game/GameResultModal.tsx

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, ArrowRight, Home, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "@tanstack/react-router";
import type { GameResult } from "@/types/game.types";
import { getTierName, getTierColor } from "@/lib/profile.utils";

interface GameResultModalProps {
  isOpen: boolean;
  result: GameResult;
  isPlayer1: boolean;
}

export function GameResultModal({
  isOpen,
  result,
  isPlayer1,
}: GameResultModalProps) {
  const navigate = useNavigate();

  const userWon =
    (isPlayer1 && result.winner === "player1") ||
    (!isPlayer1 && result.winner === "player2");
  const isDraw = result.winner === "draw";

  const userScore = isPlayer1
    ? result.player1FinalScore
    : result.player2FinalScore;
  const opponentScore = isPlayer1
    ? result.player2FinalScore
    : result.player1FinalScore;

  const userPointsChange = isPlayer1
    ? result.player1PointsChange
    : result.player2PointsChange;
  const userNewTier = isPlayer1 ? result.player1NewTier : result.player2NewTier;

  const userCorrect = isPlayer1
    ? result.player1CorrectAnswers
    : result.player2CorrectAnswers;

  useEffect(() => {
    if (isOpen && userWon) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, userWon]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Header Decoration */}
          <div
            className={`h-32 w-full flex items-center justify-center bg-gradient-to-br ${userWon ? "from-blue-500 to-indigo-600" : isDraw ? "from-slate-500 to-slate-600" : "from-red-500 to-pink-600"}`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {userWon ? (
                <Trophy className="w-16 h-16 text-white" />
              ) : (
                <Star className="w-16 h-16 text-white" />
              )}
            </motion.div>
          </div>

          <div className="p-8 pb-10">
            {/* Result Title */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                {userWon
                  ? "Victory!"
                  : isDraw
                    ? "It's a Draw!"
                    : "Nice Effort!"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {userWon ? "You dominated the arena." : "A very close match."}
              </p>
            </div>

            {/* Score Comparison */}
            <div className="flex items-center justify-center gap-8 mb-10">
              <div className="text-center">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  You
                </div>
                <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">
                  {userScore}
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Opponent
                </div>
                <div className="text-5xl font-black text-slate-400 dark:text-slate-500 tabular-nums">
                  {opponentScore}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">
                  Correct
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white text-center">
                  {userCorrect}{" "}
                  <span className="text-slate-400 font-medium">
                    / {result.totalQuestions}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">
                  Points
                </div>
                <div
                  className={`text-xl font-bold text-center ${userPointsChange >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {userPointsChange >= 0 ? "+" : ""}
                  {userPointsChange}
                </div>
              </div>
            </div>

            {/* Tier Status */}
            <div
              onClick={() => navigate({ to: "/profile" })}
              className="flex items-center gap-4 bg-slate-900 text-white p-5 rounded-[24px] mb-10 shadow-lg cursor-pointer hover:bg-slate-800 transition-colors group"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getTierColor(userNewTier)} flex items-center justify-center text-xl font-black`}
              >
                T{userNewTier}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  New Ranking
                </div>
                <div className="text-lg font-bold">
                  {getTierName(userNewTier)}
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="group-hover:text-blue-400 transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate({ to: "/" })}
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Home className="w-5 h-5" />
                Lobby
              </button>

              <button
                onClick={() => navigate({ to: "/play" })}
                className="flex-[2] px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
