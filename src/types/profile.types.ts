import type { Models } from "appwrite";

export interface UserProfile extends Models.Document {
  userId: string;
  username: string;
  country: string;
  tier: number;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  profile_image?: string;
  cover_image?: string;
  bio?: string;
}

export interface RecentMatch {
  matchId: string;
  opponentId: string;
  opponentUsername: string;
  opponentTier: number;
  opponent_profile_image?: string;
  subject: string;
  result: "won" | "lost" | "draw";
  userScore: number;
  opponentScore: number;
  pointsChanged: number;
  gameType: "classic" | "control" | "battle" | "tournament";
  playedAt: string;
  relativeTime: string;
}

export interface SubjectPerformance {
  subject: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
}

export interface TierInfo {
  currentTier: number;
  currentPoints: number;
  nextTier: number;
  pointsToNextTier: number;
  progressPercentage: number;
  tierRange: { min: number; max: number };
}

export interface ProfileStats {
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

export interface PerformanceData {
  date: string;
  wins: number;
  losses: number;
  draws: number;
}
