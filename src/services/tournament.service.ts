// src/services/tournament.service.ts

import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import type { Models } from "appwrite";
import type {
  Tournament,
  CreateTournamentInput,
  TournamentParticipant,
  TournamentMatch,
  TournamentStanding,
  TournamentStatus,
} from "@/types/tournament.types";

interface TournamentDocument extends Models.Document {
  tournamentId: string;
  name: string;
  creatorId: string;
  creatorUsername: string;
  status: TournamentStatus;
  subjects: string[];
  duration: number;
  entryLimit: number;
  participants: string[];
  participantIds: string[];
  matches: string[];
  standings: string[];
  chatMessages: string[];
  winnerId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(
    creatorId: string,
    creatorUsername: string,
    creatorTier: number,
    input: CreateTournamentInput,
  ): Promise<Tournament> {
    try {
      // Validation
      if (input.subjects.length < 1 || input.subjects.length > 3) {
        throw new Error("Please select 1-3 subjects");
      }

      if (input.name.trim().length < 3) {
        throw new Error("Tournament name must be at least 3 characters");
      }

      // Creator is first participant
      const creatorParticipant: TournamentParticipant = {
        userId: creatorId,
        username: creatorUsername,
        tier: creatorTier,
        joinedAt: new Date().toISOString(),
      };

      // We'll also store participantIds for easier querying
      const participantIds = [creatorId];

      const tournament = await databases.createDocument<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        ID.unique(),
        {
          tournamentId: ID.unique(),
          name: input.name.trim(),
          creatorId,
          creatorUsername,
          status: "waiting",
          subjects: input.subjects,
          duration: input.duration,
          entryLimit: 6,
          participants: [JSON.stringify(creatorParticipant)],
          participantIds,
          matches: [],
          standings: [],
          chatMessages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );

      // Parse JSON participants back
      return this.parseTournament(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  }

  /**
   * Get all tournaments (with optional filters)
   */
  static async getTournaments(
    status?: TournamentStatus,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Tournament[]> {
    try {
      const queries = [
        Query.orderDesc("createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ];

      if (status) {
        queries.push(Query.equal("status", status));
      }

      const response = await databases.listDocuments<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        queries,
      );

      return response.documents.map((doc) => this.parseTournament(doc));
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      throw new Error("Failed to load tournaments");
    }
  }

  /**
   * Get tournaments the user is participating in
   */
  static async getUserTournaments(userId: string): Promise<Tournament[]> {
    try {
      const response = await databases.listDocuments<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        [
          Query.contains("participantIds", userId),
          Query.orderDesc("createdAt"),
          Query.limit(100),
        ],
      );

      return response.documents.map((doc) => this.parseTournament(doc));
    } catch (error) {
      console.error("Error fetching user tournaments:", error);
      throw new Error("Failed to load your tournaments");
    }
  }

  /**
   * Get single tournament by ID
   */
  static async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const tournament = await databases.getDocument<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
      );

      return this.parseTournament(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      return null;
    }
  }

  /**
   * Join a tournament
   */
  static async joinTournament(
    tournamentId: string,
    userId: string,
    username: string,
    tier: number,
    avatarUrl?: string,
  ): Promise<Tournament> {
    try {
      const tournamentDoc = await databases.getDocument<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
      );

      const tournament = this.parseTournament(tournamentDoc);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Validation
      if (tournament.status !== "waiting") {
        throw new Error("Tournament has already started or is completed");
      }

      if (tournament.participants.length >= 6) {
        throw new Error("Tournament is full");
      }

      // Check if already joined
      if (tournament.participants.some((p) => p.userId === userId)) {
        throw new Error("You have already joined this tournament");
      }

      const newParticipant: TournamentParticipant = {
        userId,
        username,
        tier,
        avatarUrl,
        joinedAt: new Date().toISOString(),
      };

      const updatedParticipants = [...tournament.participants, newParticipant];
      const updatedParticipantIds = [
        ...(tournamentDoc.participantIds || []),
        userId,
      ];

      // Check if this is the 6th player (tournament full)
      const shouldStart = updatedParticipants.length === 6;

      const updatedData: any = {
        participants: updatedParticipants.map((p) => JSON.stringify(p)),
        participantIds: updatedParticipantIds,
        updatedAt: new Date().toISOString(),
      };

      if (shouldStart) {
        // Generate matches and start tournament
        const matches = this.generateRoundRobinMatches(updatedParticipants);
        const standings = this.initializeStandings(updatedParticipants);

        updatedData.status = "active";
        updatedData.matches = matches.map((m) => JSON.stringify(m));
        updatedData.standings = standings.map((s) => JSON.stringify(s));
        updatedData.startedAt = new Date().toISOString();
      }

      const updatedTournament =
        await databases.updateDocument<TournamentDocument>(
          DATABASE_ID,
          COLLECTIONS.TOURNAMENTS,
          tournamentId,
          updatedData,
        );

      return this.parseTournament(updatedTournament);
    } catch (error) {
      console.error("Error joining tournament:", error);
      throw error;
    }
  }

  /**
   * Leave a tournament (only if status is "waiting")
   */
  static async leaveTournament(
    tournamentId: string,
    userId: string,
  ): Promise<Tournament> {
    try {
      const tournamentDoc = await databases.getDocument<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
      );

      const tournament = this.parseTournament(tournamentDoc);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (tournament.status !== "waiting") {
        throw new Error("Cannot leave a tournament that has started");
      }

      // Cannot leave if creator (must cancel instead)
      if (tournament.creatorId === userId) {
        throw new Error("Creator cannot leave. Cancel the tournament instead.");
      }

      const updatedParticipants = tournament.participants.filter(
        (p) => p.userId !== userId,
      );
      const updatedParticipantIds = (tournamentDoc.participantIds || []).filter(
        (id: string) => id !== userId,
      );

      const updatedTournament =
        await databases.updateDocument<TournamentDocument>(
          DATABASE_ID,
          COLLECTIONS.TOURNAMENTS,
          tournamentId,
          {
            participants: updatedParticipants.map((p) => JSON.stringify(p)),
            participantIds: updatedParticipantIds,
            updatedAt: new Date().toISOString(),
          },
        );

      return this.parseTournament(updatedTournament);
    } catch (error) {
      console.error("Error leaving tournament:", error);
      throw error;
    }
  }

  /**
   * Cancel a tournament (creator only)
   */
  static async cancelTournament(
    tournamentId: string,
    userId: string,
  ): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (tournament.creatorId !== userId) {
        throw new Error("Only the creator can cancel the tournament");
      }

      if (tournament.status === "active") {
        throw new Error("Cannot cancel an active tournament");
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error cancelling tournament:", error);
      throw error;
    }
  }

  /**
   * Generate round-robin matches
   */
  private static generateRoundRobinMatches(
    participants: TournamentParticipant[],
  ): TournamentMatch[] {
    const matches: TournamentMatch[] = [];

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          matchId: ID.unique(),
          player1Id: participants[i].userId,
          player2Id: participants[j].userId,
          player1Score: 0,
          player2Score: 0,
          status: "pending",
        });
      }
    }

    return matches;
  }

  /**
   * Initialize standings
   */
  private static initializeStandings(
    participants: TournamentParticipant[],
  ): TournamentStanding[] {
    return participants.map((p) => ({
      userId: p.userId,
      username: p.username,
      totalPoints: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    }));
  }

  /**
   * Search tournaments by name
   */
  static async searchTournaments(query: string): Promise<Tournament[]> {
    try {
      const response = await databases.listDocuments<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        [
          Query.search("name", query),
          Query.orderDesc("createdAt"),
          Query.limit(20),
        ],
      );

      return response.documents.map((doc) => this.parseTournament(doc));
    } catch (error) {
      console.error("Error searching tournaments:", error);
      return [];
    }
  }

  /**
   * Helper to parse JSON fields from Appwrite document
   */
  private static parseTournament(doc: any): Tournament {
    return {
      ...doc,
      participants: (doc.participants || []).map((p: any) =>
        typeof p === "string" ? JSON.parse(p) : p,
      ),
      matches: (doc.matches || []).map((m: any) =>
        typeof m === "string" ? JSON.parse(m) : m,
      ),
      standings: (doc.standings || []).map((s: any) =>
        typeof s === "string" ? JSON.parse(s) : s,
      ),
      chatMessages: (doc.chatMessages || []).map((c: any) =>
        typeof c === "string" ? JSON.parse(c) : c,
      ),
    } as Tournament;
  }
}
