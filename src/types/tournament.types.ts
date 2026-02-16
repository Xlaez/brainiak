// src/types/tournament.types.ts

import type { Models } from "appwrite";

export type TournamentStatus = "waiting" | "active" | "completed" | "cancelled";
export type MatchStatus = "pending" | "active" | "completed";

export interface TournamentParticipant {
  userId: string;
  username: string;
  tier: number;
  avatarUrl?: string;
  joinedAt: string;
}

export interface TournamentMatch {
  matchId: string;
  player1Id: string;
  player2Id: string;
  gameRoomId?: string;
  winnerId?: string | null;
  player1Score: number;
  player2Score: number;
  status: MatchStatus;
  completedAt?: string;
}

export interface TournamentStanding {
  userId: string;
  username: string;
  totalPoints: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface TournamentChatMessage {
  messageId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
}

export interface Tournament extends Models.Document {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  tournamentId: string;
  name: string;
  creatorId: string;
  creatorUsername: string;
  status: TournamentStatus;
  subjects: string[]; // Array of subject IDs
  duration: number;
  entryLimit: number; // Always 6
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
  standings: TournamentStanding[];
  chatMessages: TournamentChatMessage[];
  currentMatchIndex: number;
  matchesCompleted: number;
  totalMatches: number;
  winnerId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentInput {
  name: string;
  subjects: string[]; // 1-3 subjects
  duration: number;
}

export interface TournamentFilters {
  status?: TournamentStatus;
  search?: string;
}
