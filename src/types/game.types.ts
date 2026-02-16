// src/types/game.types.ts
// src/types/game.types.ts
import type { Models } from "appwrite";

export interface GameRoom extends Models.Document {
  roomId: string;
  gameType: "classic" | "control" | "battle" | "tournament";
  status: "waiting" | "active" | "completed" | "cancelled";
  player1Id: string;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  player1Tier: number;
  player2Tier: number | null;
  currentQuestionIndex: number;
  questions: string[]; // Array of question IDs
  subject: string;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  winnerId: string | null;
}

export interface Question extends Models.Document {
  questionId: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  timesUsed: number;
}

export interface GameAnswer extends Models.Document {
  gameId: string;
  playerId: string;
  questionIndex: number;
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  timeTaken: number; // milliseconds
  pointsEarned: number;
  timestamp: string;
}

export interface PlayerState {
  userId: string;
  username: string;
  avatarUrl?: string;
  tier: number;
  score: number;
  streak: number; // Consecutive correct answers
  hasAnswered: boolean;
  selectedAnswer: "A" | "B" | "C" | "D" | null;
  isCorrect: boolean | null;
}

export interface GameState {
  gameRoom: GameRoom;
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  player1: PlayerState;
  player2: PlayerState;
  timeRemaining: number; // seconds
  timerActive: boolean;
  gamePhase: "waiting" | "question" | "revealing" | "completed";
  userAnswer: "A" | "B" | "C" | "D" | null;
  hasSubmittedAnswer: boolean;
}

export interface GameResult {
  winner: "player1" | "player2" | "draw";
  player1FinalScore: number;
  player2FinalScore: number;
  player1PointsChange: number;
  player2PointsChange: number;
  player1NewTier: number;
  player2NewTier: number;
  totalQuestions: number;
  player1CorrectAnswers: number;
  player2CorrectAnswers: number;
  gameDuration: number; // seconds
}
