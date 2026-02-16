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
  TournamentChatMessage,
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
  currentMatchIndex: number;
  matchesCompleted: number;
  totalMatches: number;
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
          currentMatchIndex: 0,
          matchesCompleted: 0,
          totalMatches: 0,
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

      if (shouldStart) {
        // Start the first match automatically
        await this.startNextMatch(tournamentId);
      }

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
   * Start next match in tournament (sequential mode)
   */
  static async startNextMatch(
    tournamentId: string,
  ): Promise<TournamentMatch | null> {
    try {
      const tournament = await this.getTournament(tournamentId);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (tournament.status !== "active") {
        throw new Error("Tournament is not active");
      }

      // Find first pending match
      const nextMatch = tournament.matches.find((m) => m.status === "pending");

      if (!nextMatch) {
        // No more pending matches - tournament complete
        await this.completeTournament(tournamentId);
        return null;
      }

      // Update match status to active
      const updatedMatches = tournament.matches.map((m) =>
        m.matchId === nextMatch.matchId
          ? { ...m, status: "active" as const }
          : m,
      );

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          matches: updatedMatches.map((m) => JSON.stringify(m)),
          currentMatchIndex: tournament.matches.indexOf(nextMatch),
          updatedAt: new Date().toISOString(),
        },
      );

      // Create game room for this match
      await this.createMatchGameRoom(tournamentId, nextMatch, tournament);

      return nextMatch;
    } catch (error) {
      console.error("Error starting next match:", error);
      throw error;
    }
  }

  /**
   * Create game room for a tournament match
   */
  private static async createMatchGameRoom(
    tournamentId: string,
    match: TournamentMatch,
    tournament: Tournament,
  ): Promise<string> {
    try {
      // Get player data
      const player1 = tournament.participants.find(
        (p) => p.userId === match.player1Id,
      );
      const player2 = tournament.participants.find(
        (p) => p.userId === match.player2Id,
      );

      if (!player1 || !player2) {
        throw new Error("Match players not found");
      }

      // Select random subject from tournament subjects
      const randomSubject =
        tournament.subjects[
          Math.floor(Math.random() * tournament.subjects.length)
        ];

      const gameRoomId = ID.unique();
      const gameRoom = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        gameRoomId,
        {
          roomId: gameRoomId,
          gameType: "battle",
          status: "waiting",
          player1Id: player1.userId,
          player2Id: player2.userId,
          player1Tier: player1.tier,
          player2Tier: player2.tier,
          player1Score: 0,
          player2Score: 0,
          currentQuestionIndex: 0,
          questions: [], // Will be populated when game starts
          subject: randomSubject,
          duration: tournament.duration,
          tournamentId,
          tournamentMatchId: match.matchId,
          startTime: null,
          endTime: null,
          winnerId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );

      // Update match with game room ID and ensure status is active
      const updatedMatches = tournament.matches.map((m) =>
        m.matchId === match.matchId
          ? {
              ...m,
              gameRoomId: gameRoom.$id,
              status: "active" as const, // Ensure status is active to prevent overwrite
            }
          : m,
      );

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          matches: updatedMatches.map((m) => JSON.stringify(m)),
          updatedAt: new Date().toISOString(),
        },
      );

      return gameRoom.$id;
    } catch (error) {
      console.error("Error creating match game room:", error);
      throw error;
    }
  }

  /**
   * Resume an active match that is missing a game room (recovery)
   */
  static async resumeMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) throw new Error("Tournament not found");

      const match = tournament.matches.find((m) => m.matchId === matchId);
      if (!match) throw new Error("Match not found");

      if (match.status !== "active") {
        throw new Error("Match is not active");
      }

      if (match.gameRoomId) {
        // Already has room, nothing to do
        return;
      }

      // Create room for this active match
      await this.createMatchGameRoom(tournamentId, match, tournament);
    } catch (error) {
      console.error("Error resuming match:", error);
      throw error;
    }
  }

  /**
   * Complete a tournament match and update standings
   */
  static async completeMatch(
    tournamentId: string,
    matchId: string,
    winnerId: string | null,
    player1Score: number,
    player2Score: number,
  ): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Update match
      const updatedMatches = tournament.matches.map((m) => {
        if (m.matchId === matchId) {
          return {
            ...m,
            status: "completed" as const,
            winnerId,
            player1Score,
            player2Score,
            completedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      // Update standings
      const updatedStandings = this.updateStandings(
        tournament.standings,
        tournament.matches.find((m) => m.matchId === matchId)!,
        winnerId,
        player1Score,
        player2Score,
      );

      const completedCount = updatedMatches.filter(
        (m) => m.status === "completed",
      ).length;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          matches: updatedMatches.map((m) => JSON.stringify(m)),
          standings: updatedStandings.map((s) => JSON.stringify(s)),
          matchesCompleted: completedCount,
          updatedAt: new Date().toISOString(),
        },
      );

      // Check if tournament is complete
      if (completedCount === tournament.matches.length) {
        await this.completeTournament(tournamentId);
      }
    } catch (error) {
      console.error("Error completing match:", error);
      throw error;
    }
  }

  /**
   * Update standings after a match
   */
  private static updateStandings(
    currentStandings: TournamentStanding[],
    match: TournamentMatch,
    winnerId: string | null,
    player1Score: number,
    player2Score: number,
  ): TournamentStanding[] {
    return currentStandings.map((standing) => {
      if (standing.userId === match.player1Id) {
        return {
          ...standing,
          totalPoints: standing.totalPoints + player1Score,
          wins: standing.wins + (winnerId === match.player1Id ? 1 : 0),
          losses: standing.losses + (winnerId === match.player2Id ? 1 : 0),
          draws: standing.draws + (winnerId === null ? 1 : 0),
        };
      }

      if (standing.userId === match.player2Id) {
        return {
          ...standing,
          totalPoints: standing.totalPoints + player2Score,
          wins: standing.wins + (winnerId === match.player2Id ? 1 : 0),
          losses: standing.losses + (winnerId === match.player1Id ? 1 : 0),
          draws: standing.draws + (winnerId === null ? 1 : 0),
        };
      }

      return standing;
    });
  }

  /**
   * Complete tournament
   */
  private static async completeTournament(tournamentId: string): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);

      if (!tournament) return;

      // Sort standings by total points (descending)
      const sortedStandings = [...tournament.standings].sort(
        (a, b) => b.totalPoints - a.totalPoints,
      );

      const winner = sortedStandings[0];

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          status: "completed",
          standings: sortedStandings.map((s) => JSON.stringify(s)),
          winnerId: winner.userId,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error completing tournament:", error);
      throw error;
    }
  }

  /**
   * Get current/next match for a player
   */
  static async getPlayerNextMatch(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentMatch | null> {
    try {
      const tournament = await this.getTournament(tournamentId);

      if (!tournament) return null;

      // Find active match involving this player
      const activeMatch = tournament.matches.find(
        (m) =>
          m.status === "active" &&
          (m.player1Id === userId || m.player2Id === userId),
      );

      if (activeMatch) return activeMatch;

      // Find next pending match involving this player
      const nextMatch = tournament.matches.find(
        (m) =>
          m.status === "pending" &&
          (m.player1Id === userId || m.player2Id === userId),
      );

      return nextMatch || null;
    } catch (error) {
      console.error("Error getting player next match:", error);
      return null;
    }
  }

  /**
   * Get tournament progress
   */
  static getTournamentProgress(tournament: Tournament): {
    completedMatches: number;
    totalMatches: number;
    percentage: number;
  } {
    const completedMatches = tournament.matches.filter(
      (m) => m.status === "completed",
    ).length;

    const totalMatches = tournament.matches.length;
    const percentage =
      totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return {
      completedMatches,
      totalMatches,
      percentage,
    };
  }

  /**
   * Send chat message in tournament
   */
  static async sendChatMessage(
    tournamentId: string,
    userId: string,
    username: string,
    message: string,
    avatarUrl?: string,
  ): Promise<void> {
    try {
      // Validation
      if (!message.trim()) {
        throw new Error("Message cannot be empty");
      }

      if (message.length > 500) {
        throw new Error("Message too long (max 500 characters)");
      }

      const tournamentDoc = await databases.getDocument<TournamentDocument>(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
      );

      const tournament = this.parseTournament(tournamentDoc);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Check if user is participant
      const isParticipant = tournament.participants.some(
        (p) => p.userId === userId,
      );

      if (!isParticipant) {
        throw new Error("Only participants can send messages");
      }

      const chatMessage: TournamentChatMessage = {
        messageId: ID.unique(),
        userId,
        username,
        avatarUrl,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...tournament.chatMessages, chatMessage];

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          chatMessages: updatedMessages.map((m) => JSON.stringify(m)),
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  /**
   * Get chat messages
   */
  static getChatMessages(
    tournament: Tournament,
    limit?: number,
  ): TournamentChatMessage[] {
    const messages = tournament.chatMessages || [];

    if (limit) {
      return messages.slice(-limit); // Get last N messages
    }

    return messages;
  }

  /**
   * Clear chat (admin only)
   */
  static async clearChat(tournamentId: string, userId: string): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (tournament.creatorId !== userId) {
        throw new Error("Only tournament creator can clear chat");
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId,
        {
          chatMessages: [],
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error clearing chat:", error);
      throw error;
    }
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
      currentMatchIndex: doc.currentMatchIndex || 0,
      matchesCompleted: doc.matchesCompleted || 0,
      totalMatches: doc.totalMatches || 0,
    } as Tournament;
  }
}
