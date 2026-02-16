// src/pages/GameRoom.tsx

import { useParams } from "@tanstack/react-router";
import { useGame } from "@/hooks/useGame";
import { PlayerCard } from "@/components/game/PlayerCard";
import { Timer } from "@/components/game/Timer";
import { QuestionCard } from "@/components/game/QuestionCard";
import { ProgressBar } from "@/components/game/ProgressBar";
import { GameResultModal } from "@/components/game/GameResultModal";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { GameResult } from "@/types/game.types";
import { GameService } from "@/services/game.service";

export default function GameRoom() {
  const { gameRoomId } = useParams({ from: "/game/$gameRoomId" });
  const { gameState, isLoading, timeRemaining, submitAnswer } =
    useGame(gameRoomId);
  const user = useAuthStore((state) => state.user);

  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Fetch results when game ends
  useEffect(() => {
    if (gameState?.gamePhase === "completed" && !gameResult) {
      const fetchResults = async () => {
        try {
          // Fetch the completed room data to get final stats
          const result = await GameService.endGame(gameRoomId);
          setGameResult(result);
        } catch (error) {
          console.error("[GameRoom] Error fetching results:", error);
        }
      };

      fetchResults();
    }
  }, [gameState?.gamePhase, gameRoomId, gameResult]);

  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Brain className="w-12 h-12 text-blue-500" />
        </motion.div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">
          Synchronizing Neural Interface...
        </p>
      </div>
    );
  }

  const isPlayer1 = gameState.player1.userId === user?.$id;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-6 lg:p-10 font-lato">
      <div className="max-w-[1280px] mx-auto grid grid-rows-[auto_1fr_auto] gap-8 h-[calc(100vh-80px)]">
        {/* Header: Player Info */}
        <header className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8">
          <PlayerCard
            player={gameState.player1}
            isCurrentUser={isPlayer1}
            isActive={true}
          />

          <div className="hidden md:block">
            <Timer timeRemaining={timeRemaining} totalTime={10} />
          </div>

          <PlayerCard
            player={gameState.player2}
            isCurrentUser={!isPlayer1}
            isActive={true}
          />

          {/* Mobile Timer */}
          <div className="md:hidden flex justify-center">
            <Timer timeRemaining={timeRemaining} totalTime={10} />
          </div>
        </header>

        {/* Main: Question Section */}
        <main className="flex flex-col justify-center max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {gameState.currentQuestion ? (
              <QuestionCard
                key={gameState.currentQuestionIndex}
                question={gameState.currentQuestion}
                questionNumber={gameState.currentQuestionIndex + 1}
                totalQuestions={gameState.questions.length}
                userAnswer={gameState.userAnswer}
                hasSubmitted={gameState.hasSubmittedAnswer}
                onSelectAnswer={submitAnswer}
                showCorrectAnswer={gameState.gamePhase === "revealing"}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                  Awaiting Next Question...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer: Progress & HUD */}
        <footer className="max-w-4xl mx-auto w-full px-4">
          <ProgressBar
            current={gameState.currentQuestionIndex + 1}
            total={gameState.questions.length}
          />
        </footer>
      </div>

      {/* Result Modal */}
      {gameResult && (
        <GameResultModal
          isOpen={gameState.gamePhase === "completed"}
          result={gameResult}
          isPlayer1={isPlayer1}
        />
      )}
    </div>
  );
}
