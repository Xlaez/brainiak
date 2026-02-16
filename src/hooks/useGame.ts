// src/hooks/useGame.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { GameService } from "@/services/game.service";
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import type { GameState, GameAnswer } from "@/types/game.types";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { ProfileService } from "@/services/profile.service";

const QUESTION_TIME_LIMIT = 10; // seconds
const REVEAL_DELAY = 1500; // 1.5 seconds to show correct answer

export function useGame(gameRoomId: string) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT);
  const [answerSubmitTime, setAnswerSubmitTime] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Fetch game room
  const { data: gameRoom, isLoading } = useQuery({
    queryKey: ["gameRoom", gameRoomId],
    queryFn: () => GameService.getGameRoom(gameRoomId),
    refetchInterval: false,
  });

  // Fetch questions
  const { data: questions } = useQuery({
    queryKey: ["gameQuestions", gameRoom?.questions],
    queryFn: () => GameService.getGameQuestions(gameRoom!.questions),
    enabled: !!gameRoom?.questions,
  });

  // Initialize game state and fetch player details
  useEffect(() => {
    if (!gameRoom || !questions || !user) return;

    // Validate user is a participant
    const isPlayer =
      gameRoom.player1Id === user.$id || gameRoom.player2Id === user.$id;
    if (!isPlayer) {
      console.warn("[useGame] User is not a participant in this game");
      navigate({ to: "/" });
      return;
    }

    const initPlayers = async () => {
      // Fetch profile details for both players
      const player1Profile = await ProfileService.getUserProfile(
        gameRoom.player1Id,
      );
      const player2Profile = gameRoom.player2Id
        ? await ProfileService.getUserProfile(gameRoom.player2Id)
        : null;

      setGameState({
        gameRoom,
        questions,
        currentQuestionIndex: gameRoom.currentQuestionIndex,
        currentQuestion: questions[gameRoom.currentQuestionIndex] || null,
        player1: {
          userId: gameRoom.player1Id,
          username: player1Profile?.username || "Player 1",
          avatarUrl: ProfileService.getImageUrl(player1Profile?.profile_image),
          tier: gameRoom.player1Tier,
          score: gameRoom.player1Score,
          streak: 0,
          hasAnswered: false,
          selectedAnswer: null,
          isCorrect: null,
        },
        player2: {
          userId: gameRoom.player2Id!,
          username: player2Profile?.username || "Player 2",
          avatarUrl: ProfileService.getImageUrl(player2Profile?.profile_image),
          tier: gameRoom.player2Tier!,
          score: gameRoom.player2Score,
          streak: 0,
          hasAnswered: false,
          selectedAnswer: null,
          isCorrect: null,
        },
        timeRemaining: QUESTION_TIME_LIMIT,
        timerActive: gameRoom.status === "active",
        gamePhase: gameRoom.status === "active" ? "question" : "waiting",
        userAnswer: null,
        hasSubmittedAnswer: false,
      });

      // Start game if waiting
      if (gameRoom.status === "waiting") {
        await GameService.startGame(gameRoomId);
      }
    };

    initPlayers();
  }, [gameRoom, questions, user, gameRoomId, navigate]);

  // Handle both answered logic
  const triggerReveal = useCallback(async () => {
    setGameState((prev) => {
      if (!prev) return null;
      return { ...prev, gamePhase: "revealing", timerActive: false };
    });

    // Stop local timer just in case
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Wait to show correct answer before moving on
    await new Promise((resolve) => setTimeout(resolve, REVEAL_DELAY));

    // Only the host or one designated player should trigger the next question
    if (user?.$id === gameRoom?.player1Id) {
      const currentIndex = gameState?.currentQuestionIndex ?? 0;
      const totalQuestions = questions?.length ?? 0;

      if (currentIndex < totalQuestions - 1) {
        await GameService.moveToNextQuestion(gameRoomId);
      } else {
        await GameService.endGame(gameRoomId);
      }
    }
  }, [
    gameRoomId,
    user?.$id,
    gameRoom?.player1Id,
    gameState?.currentQuestionIndex,
    questions?.length,
  ]);

  // Question timer
  useEffect(() => {
    if (
      !gameState ||
      !gameState.timerActive ||
      gameState.gamePhase !== "question"
    )
      return;

    questionStartTime.current = Date.now();
    setTimeRemaining(QUESTION_TIME_LIMIT);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    gameState?.currentQuestionIndex,
    gameState?.timerActive,
    gameState?.gamePhase,
  ]);

  // Subscribe to game room updates
  useEffect(() => {
    if (!gameRoomId) return;

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.GAME_ROOMS}.documents.${gameRoomId}`,
      (response) => {
        const updatedRoom = response.payload as any;

        setGameState((prev) => {
          if (!prev) return null;

          const isNewQuestion =
            updatedRoom.currentQuestionIndex !== prev.currentQuestionIndex;

          const newState = {
            ...prev,
            gameRoom: updatedRoom,
            currentQuestionIndex: updatedRoom.currentQuestionIndex,
            currentQuestion:
              prev.questions[updatedRoom.currentQuestionIndex] || null,
            player1: { ...prev.player1, score: updatedRoom.player1Score },
            player2: { ...prev.player2, score: updatedRoom.player2Score },
          };

          if (isNewQuestion) {
            // Reset question-specific state
            newState.userAnswer = null;
            newState.hasSubmittedAnswer = false;
            newState.timerActive = true;
            newState.gamePhase = "question";
            newState.player1.hasAnswered = false;
            newState.player1.selectedAnswer = null;
            newState.player1.isCorrect = null;
            newState.player2.hasAnswered = false;
            newState.player2.selectedAnswer = null;
            newState.player2.isCorrect = null;
          }

          return newState;
        });

        // Check if game ended
        if (updatedRoom.status === "completed") {
          setGameState((prev) =>
            prev ? { ...prev, gamePhase: "completed" } : null,
          );
        }
      },
    );

    return unsubscribe;
  }, [gameRoomId]);

  // Subscribe to opponent answers
  useEffect(() => {
    if (!gameRoomId || !gameState || !user) return;

    const opponentId =
      gameState.player1.userId === user.$id
        ? gameState.player2.userId
        : gameState.player1.userId;

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.GAME_ANSWERS}.documents`,
      async (response) => {
        const answer = response.payload as GameAnswer;

        if (
          answer.gameId === gameRoomId &&
          answer.playerId === opponentId &&
          answer.questionIndex === gameState.currentQuestionIndex
        ) {
          // Opponent answered
          setGameState((prev) => {
            if (!prev) return null;

            const opponentKey =
              prev.player1.userId === user.$id ? "player2" : "player1";

            return {
              ...prev,
              [opponentKey]: {
                ...prev[opponentKey],
                hasAnswered: true,
                selectedAnswer: answer.selectedAnswer,
                isCorrect: answer.isCorrect,
              },
            };
          });

          // Check if both answered to move to reveal phase
          const bothNowAnswered = await GameService.checkBothAnswered(
            gameRoomId,
            gameState.currentQuestionIndex,
          );
          if (bothNowAnswered) {
            triggerReveal();
          }
        }
      },
    );

    return unsubscribe;
  }, [gameRoomId, gameState?.currentQuestionIndex, user?.$id, triggerReveal]);

  const submitAnswer = useCallback(
    async (selectedAnswer: "A" | "B" | "C" | "D") => {
      if (!gameState || !user || gameState.hasSubmittedAnswer) return;

      const timeTaken = Date.now() - questionStartTime.current;
      const isCorrect =
        selectedAnswer === gameState.currentQuestion?.correctAnswer;

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Update local state immediately for snappy UI
      setGameState((prev) => {
        if (!prev) return null;

        const userKey =
          prev.player1.userId === user.$id ? "player1" : "player2";

        const newState = {
          ...prev,
          userAnswer: selectedAnswer,
          hasSubmittedAnswer: true,
          timerActive: false,
          [userKey]: {
            ...prev[userKey],
            hasAnswered: true,
            selectedAnswer,
            isCorrect,
          },
        };

        return newState;
      });

      setAnswerSubmitTime(timeTaken);

      try {
        // Submit to database
        const answer = await GameService.submitAnswer(
          gameRoomId,
          user.$id,
          gameState.currentQuestionIndex,
          selectedAnswer,
          isCorrect,
          timeTaken,
        );

        // Update score if correct
        if (isCorrect && answer.pointsEarned > 0) {
          await GameService.updateScore(
            gameRoomId,
            user.$id,
            answer.pointsEarned,
          );
        }

        // Check if both answered
        const bothAnswered = await GameService.checkBothAnswered(
          gameRoomId,
          gameState.currentQuestionIndex,
        );

        if (bothAnswered) {
          triggerReveal();
        }
      } catch (error) {
        console.error("[useGame] Error submitting answer:", error);
      }
    },
    [gameState, user, gameRoomId, triggerReveal],
  );

  const handleTimeExpired = useCallback(async () => {
    if (!gameState || gameState.hasSubmittedAnswer) return;

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        hasSubmittedAnswer: true,
        timerActive: false,
      };
    });

    // Still need to check if we reveal
    const bothAnswered = await GameService.checkBothAnswered(
      gameRoomId,
      gameState.currentQuestionIndex,
    );

    if (bothAnswered) {
      triggerReveal();
    } else {
      // If time expired and opponent hasn't answered, we still trigger reveal eventually?
      // Usually we wait for opponent or timeout.
      // For now, let's trigger reveal to keep it moving if one person is timed out.
      triggerReveal();
    }
  }, [gameState, gameRoomId, triggerReveal]);

  return {
    gameState,
    isLoading: isLoading || !gameState,
    timeRemaining,
    submitAnswer,
    answerSubmitTime,
  };
}
