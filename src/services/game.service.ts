// src/services/game.service.ts

import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import type {
  GameRoom,
  Question,
  GameAnswer,
  GameResult,
} from "@/types/game.types";

export class GameService {
  /**
   * Fetch game room by ID
   */
  static async getGameRoom(gameRoomId: string): Promise<GameRoom | null> {
    try {
      const room = await databases.getDocument<GameRoom>(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        gameRoomId,
      );
      return room;
    } catch (error) {
      console.error("[GameService] Error fetching game room:", error);
      return null;
    }
  }

  /**
   * Fetch all questions for a game
   */
  static async getGameQuestions(questionIds: string[]): Promise<Question[]> {
    try {
      if (!questionIds || questionIds.length === 0) return [];

      const questions: Question[] = [];

      // Fetch in batches to respect API limits
      const batchSize = 25;
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);

        const results = await databases.listDocuments<Question>(
          DATABASE_ID,
          COLLECTIONS.QUESTIONS,
          [Query.equal("$id", batch), Query.limit(batchSize)],
        );

        questions.push(...results.documents);
      }

      // Sort by original order provided in the array
      const orderedQuestions = questionIds
        .map((id) => questions.find((q) => q.$id === id))
        .filter((q): q is Question => q !== undefined);

      return orderedQuestions;
    } catch (error) {
      console.error("[GameService] Error fetching questions:", error);
      throw new Error("Failed to load questions");
    }
  }

  /**
   * Submit an answer
   */
  static async submitAnswer(
    gameId: string,
    playerId: string,
    questionIndex: number,
    selectedAnswer: "A" | "B" | "C" | "D",
    isCorrect: boolean,
    timeTaken: number,
  ): Promise<GameAnswer> {
    try {
      // Calculate points earned
      const basePoints = 2;
      const speedBonus = timeTaken < 5000 ? 1 : 0; // Bonus if answered in <5s
      const pointsEarned = isCorrect ? basePoints + speedBonus : 0;

      const answer = await databases.createDocument<GameAnswer>(
        DATABASE_ID,
        COLLECTIONS.GAME_ANSWERS,
        ID.unique(),
        {
          gameId,
          playerId,
          questionIndex,
          selectedAnswer,
          isCorrect,
          timeTaken,
          pointsEarned,
          timestamp: new Date().toISOString(),
        },
      );

      return answer;
    } catch (error) {
      console.error("[GameService] Error submitting answer:", error);
      throw new Error("Failed to submit answer");
    }
  }

  /**
   * Update game room score
   */
  static async updateScore(
    gameRoomId: string,
    playerId: string,
    scoreToAdd: number,
  ): Promise<void> {
    try {
      const room = await this.getGameRoom(gameRoomId);
      if (!room) throw new Error("Game room not found");

      const isPlayer1 = room.player1Id === playerId;
      const currentScore = isPlayer1 ? room.player1Score : room.player2Score;
      const newScore = currentScore + scoreToAdd;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        gameRoomId,
        {
          [isPlayer1 ? "player1Score" : "player2Score"]: newScore,
        },
      );
    } catch (error) {
      console.error("[GameService] Error updating score:", error);
      throw new Error("Failed to update score");
    }
  }

  /**
   * Move to next question
   */
  static async moveToNextQuestion(gameRoomId: string): Promise<void> {
    try {
      const room = await this.getGameRoom(gameRoomId);
      if (!room) throw new Error("Game room not found");

      const nextIndex = room.currentQuestionIndex + 1;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        gameRoomId,
        {
          currentQuestionIndex: nextIndex,
        },
      );
    } catch (error) {
      console.error("[GameService] Error moving to next question:", error);
      throw new Error("Failed to move to next question");
    }
  }

  /**
   * Check if both players have answered current question
   */
  static async checkBothAnswered(
    gameId: string,
    questionIndex: number,
  ): Promise<boolean> {
    try {
      const answers = await databases.listDocuments<GameAnswer>(
        DATABASE_ID,
        COLLECTIONS.GAME_ANSWERS,
        [
          Query.equal("gameId", gameId),
          Query.equal("questionIndex", questionIndex),
          Query.limit(2),
        ],
      );

      return answers.total === 2;
    } catch (error) {
      console.error("[GameService] Error checking answers:", error);
      return false;
    }
  }

  /**
   * Get opponent's answer for current question
   */
  static async getOpponentAnswer(
    gameId: string,
    questionIndex: number,
    opponentId: string,
  ): Promise<GameAnswer | null> {
    try {
      const answers = await databases.listDocuments<GameAnswer>(
        DATABASE_ID,
        COLLECTIONS.GAME_ANSWERS,
        [
          Query.equal("gameId", gameId),
          Query.equal("questionIndex", questionIndex),
          Query.equal("playerId", opponentId),
          Query.limit(1),
        ],
      );

      return answers.total > 0 ? answers.documents[0] : null;
    } catch (error) {
      console.error("[GameService] Error fetching opponent answer:", error);
      return null;
    }
  }

  /**
   * End game and calculate results
   */
  static async endGame(gameRoomId: string): Promise<GameResult> {
    try {
      const room = await this.getGameRoom(gameRoomId);
      if (!room) throw new Error("Game room not found");

      // Fetch all answers
      const player1Answers = await databases.listDocuments<GameAnswer>(
        DATABASE_ID,
        COLLECTIONS.GAME_ANSWERS,
        [
          Query.equal("gameId", gameRoomId),
          Query.equal("playerId", room.player1Id),
          Query.limit(100),
        ],
      );

      const player2Answers = await databases.listDocuments<GameAnswer>(
        DATABASE_ID,
        COLLECTIONS.GAME_ANSWERS,
        [
          Query.equal("gameId", gameRoomId),
          Query.equal("playerId", room.player2Id!),
          Query.limit(100),
        ],
      );

      const player1Correct = player1Answers.documents.filter(
        (a) => a.isCorrect,
      ).length;
      const player2Correct = player2Answers.documents.filter(
        (a) => a.isCorrect,
      ).length;

      // Determine winner
      let winner: "player1" | "player2" | "draw";
      let winnerId: string | null;

      if (room.player1Score > room.player2Score) {
        winner = "player1";
        winnerId = room.player1Id;
      } else if (room.player2Score > room.player1Score) {
        winner = "player2";
        winnerId = room.player2Id;
      } else {
        winner = "draw";
        winnerId = null;
      }

      // Calculate points change
      const { player1Change, player2Change } = this.calculatePointsChange(
        room.player1Tier,
        room.player2Tier!,
        winner,
      );

      // Calculate new points and tiers
      const player1CurrentPoints = await this.getUserPoints(room.player1Id);
      const player2CurrentPoints = await this.getUserPoints(room.player2Id!);

      const player1NewPoints = player1CurrentPoints + player1Change;
      const player2NewPoints = player2CurrentPoints + player2Change;

      const player1NewTier = this.calculateTier(player1NewPoints);
      const player2NewTier = this.calculateTier(player2NewPoints);

      // Update game room
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        gameRoomId,
        {
          status: "completed",
          winnerId,
          endTime: new Date().toISOString(),
        },
      );

      // Update player profiles
      await this.updatePlayerProfile(
        room.player1Id,
        player1Change,
        winner === "player1",
      );

      await this.updatePlayerProfile(
        room.player2Id!,
        player2Change,
        winner === "player2",
      );

      const gameDuration = room.startTime
        ? (new Date().getTime() - new Date(room.startTime).getTime()) / 1000
        : 0;

      return {
        winner,
        player1FinalScore: room.player1Score,
        player2FinalScore: room.player2Score,
        player1PointsChange: player1Change,
        player2PointsChange: player2Change,
        player1NewTier,
        player2NewTier,
        totalQuestions: room.questions.length,
        player1CorrectAnswers: player1Correct,
        player2CorrectAnswers: player2Correct,
        gameDuration: Math.floor(gameDuration),
      };
    } catch (error) {
      console.error("[GameService] Error ending game:", error);
      throw new Error("Failed to end game");
    }
  }

  /**
   * Calculate points change based on tier difference
   */
  private static calculatePointsChange(
    player1Tier: number,
    player2Tier: number,
    winner: "player1" | "player2" | "draw",
  ): { player1Change: number; player2Change: number } {
    const BASE_WIN_POINTS = 20;
    const BASE_LOSS_POINTS = 10;
    const TIER_MULTIPLIER = 1.5;

    if (winner === "draw") {
      const drawPoints = 5;
      return { player1Change: drawPoints, player2Change: drawPoints };
    }

    const tierDifference = Math.abs(player1Tier - player2Tier);

    if (winner === "player1") {
      // Player 1 won
      const player1Points =
        player1Tier > player2Tier
          ? BASE_WIN_POINTS + tierDifference * TIER_MULTIPLIER
          : BASE_WIN_POINTS - tierDifference * TIER_MULTIPLIER * 0.5;

      const player2Points =
        player1Tier < player2Tier
          ? -(BASE_LOSS_POINTS - tierDifference * TIER_MULTIPLIER * 0.3)
          : -(BASE_LOSS_POINTS + tierDifference * TIER_MULTIPLIER);

      return {
        player1Change: Math.round(player1Points),
        player2Change: Math.round(player2Points),
      };
    } else {
      // Player 2 won
      const player2Points =
        player2Tier > player1Tier
          ? BASE_WIN_POINTS + tierDifference * TIER_MULTIPLIER
          : BASE_WIN_POINTS - tierDifference * TIER_MULTIPLIER * 0.5;

      const player1Points =
        player2Tier < player1Tier
          ? -(BASE_LOSS_POINTS - tierDifference * TIER_MULTIPLIER * 0.3)
          : -(BASE_LOSS_POINTS + tierDifference * TIER_MULTIPLIER);

      return {
        player1Change: Math.round(player1Points),
        player2Change: Math.round(player2Points),
      };
    }
  }

  /**
   * Calculate tier from points
   */
  private static calculateTier(points: number): number {
    const TIER_RANGES = [
      { tier: 10, min: 0, max: 100 },
      { tier: 9, min: 101, max: 200 },
      { tier: 8, min: 201, max: 300 },
      { tier: 7, min: 301, max: 400 },
      { tier: 6, min: 401, max: 500 },
      { tier: 5, min: 501, max: 600 },
      { tier: 4, min: 601, max: 700 },
      { tier: 3, min: 701, max: 800 },
      { tier: 2, min: 801, max: 900 },
      { tier: 1, min: 901, max: Infinity },
    ];

    for (const range of TIER_RANGES) {
      if (points >= range.min && points <= range.max) {
        return range.tier;
      }
    }
    return 1;
  }

  /**
   * Get user's current points
   */
  private static async getUserPoints(userId: string): Promise<number> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("userId", userId), Query.limit(1)],
      );

      return result.total > 0 ? (result.documents[0] as any).totalPoints : 0;
    } catch (error) {
      console.error("[GameService] Error fetching user points:", error);
      return 0;
    }
  }

  /**
   * Update player profile after game
   */
  private static async updatePlayerProfile(
    userId: string,
    pointsChange: number,
    won: boolean,
  ): Promise<void> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("userId", userId), Query.limit(1)],
      );

      if (result.total === 0) return;

      const profile = result.documents[0];
      const newPoints = Math.max(
        0,
        (profile as any).totalPoints + pointsChange,
      );
      const newTier = this.calculateTier(newPoints);
      const newGamesPlayed = ((profile as any).gamesPlayed || 0) + 1;
      const newGamesWon = won
        ? ((profile as any).gamesWon || 0) + 1
        : (profile as any).gamesWon || 0;
      const newGamesLost = !won
        ? ((profile as any).gamesLost || 0) + 1
        : (profile as any).gamesLost || 0;
      const newWinRate = (newGamesWon / newGamesPlayed) * 100;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        profile.$id,
        {
          totalPoints: newPoints,
          tier: newTier,
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          gamesLost: newGamesLost,
          winRate: newWinRate,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("[GameService] Error updating player profile:", error);
    }
  }

  /**
   * Start game (set status to active and startTime)
   */
  static async startGame(gameRoomId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        gameRoomId,
        {
          status: "active",
          startTime: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("[GameService] Error starting game:", error);
      throw new Error("Failed to start game");
    }
  }
}
