// src/types/leaderboard.types.ts

export interface LeaderboardPlayer {
  userId: string;
  username: string;
  country: string;
  tier: number;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  avatarUrl?: string;
  rank: number; // Calculated
}

export interface LeaderboardFilters {
  tier?: number;
  search?: string;
  country?: string;
}

export type LeaderboardType = "global" | "regional";

export interface UserRankInfo {
  rank: number;
  totalPlayers: number;
  percentile: number; // Top X%
}

export interface PodiumPlayer {
  rank: 1 | 2 | 3;
  player: LeaderboardPlayer;
}
