import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import type {
  GameConfiguration,
  QueueEntry,
  BattleRoom,
} from "@/types/play.types";

export class PlayService {
  static async joinQueue(
    userId: string,
    username: string,
    tier: number,
    config: GameConfiguration,
  ): Promise<QueueEntry> {
    try {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.MATCHMAKING_QUEUE,
          userId,
        );
        console.log(`[PlayService] Cleared stale queue entry for ${userId}`);
      } catch (e) {
        // Ignore if document with userId doesn't exist
      }

      const existing = await databases.listDocuments<QueueEntry>(
        DATABASE_ID,
        COLLECTIONS.MATCHMAKING_QUEUE,
        [Query.equal("userId", userId)],
      );

      if (existing.total > 0) {
        for (const doc of existing.documents) {
          if (doc.$id !== userId) {
            await databases.deleteDocument(
              DATABASE_ID,
              COLLECTIONS.MATCHMAKING_QUEUE,
              doc.$id,
            );
          }
        }
      }

      const newEntry = await databases.createDocument<QueueEntry>(
        DATABASE_ID,
        COLLECTIONS.MATCHMAKING_QUEUE,
        userId,
        {
          queueId: userId,
          userId,
          username,
          tier,
          gameType: config.mode,
          selectedTier: config.selectedTier,
          subject: config.subject,
          duration: config.duration,
          joinedAt: new Date().toISOString(),
          status: "waiting",
        },
      );

      console.log(
        `[PlayService] Searching for compatible opponents for ${userId}...`,
      );
      await this.findMatch(newEntry);

      // Re-fetch to get any status updates from findMatch
      return await databases.getDocument<QueueEntry>(
        DATABASE_ID,
        COLLECTIONS.MATCHMAKING_QUEUE,
        newEntry.$id,
      );
    } catch (error: any) {
      console.error("Error joining queue:", error);
      throw new Error(error.message || "Failed to join matchmaking queue");
    }
  }

  private static async findMatch(userEntry: QueueEntry): Promise<void> {
    try {
      const queries = [
        Query.equal("status", "waiting"),
        Query.equal("gameType", userEntry.gameType),
        Query.equal("subject", userEntry.subject),
        Query.equal("duration", userEntry.duration),
        Query.notEqual("userId", userEntry.userId), // Don't match with self
        Query.limit(1),
      ];

      const opponents = await databases.listDocuments<QueueEntry>(
        DATABASE_ID,
        COLLECTIONS.MATCHMAKING_QUEUE,
        queries,
      );

      if (opponents.total > 0) {
        const opponent = opponents.documents[0];
        console.log(
          `[PlayService] Match found! Opponent: ${opponent.username} (${opponent.userId})`,
        );

        const questionsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.QUESTIONS,
          [Query.equal("subject", userEntry.subject), Query.limit(5)],
        );

        if (questionsResponse.total === 0) {
          throw new Error(
            "No questions found for this subject. Match aborted.",
          );
        }

        const questionIds = questionsResponse.documents.map((q) => q.$id);

        const gameRoom = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.GAME_ROOMS,
          ID.unique(),
          {
            roomId: ID.unique(),
            player1Id: userEntry.userId,
            player1Score: 0,
            player1Tier: userEntry.tier,
            player2Id: opponent.userId,
            player2Score: 0,
            player2Tier: opponent.tier,
            questions: questionIds,
            currentQuestionIndex: 0,
            status: "active", // Start immediately for matchmaking
            gameType: userEntry.gameType,
            subject: userEntry.subject,
            duration: userEntry.duration,
            startTime: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        );

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.MATCHMAKING_QUEUE,
          opponent.$id,
          {
            status: "matched",
            matchedWith: userEntry.userId,
          },
        );

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.MATCHMAKING_QUEUE,
          userEntry.$id,
          {
            status: "matched",
            matchedWith: opponent.userId,
          },
        );

        console.log(`[PlayService] Game Room created: ${gameRoom.$id}`);
      } else {
        console.log("[PlayService] No compatible opponents waiting.");
      }
    } catch (error) {
      console.error("[PlayService] findMatch failed:", error);
      // We don't throw here to keep the user in the queue even if match finding glitched
    }
  }

  /**
   * Leave matchmaking queue (cancel search)
   */
  static async leaveQueue(userId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MATCHMAKING_QUEUE,
        userId,
        { status: "cancelled" },
      );
    } catch (error) {
      console.error("Error leaving queue:", error);
      throw new Error("Failed to cancel search");
    }
  }

  /**
   * Check if a match has been found
   */
  static async checkMatch(documentId: string): Promise<{
    matched: boolean;
    gameRoomId?: string;
  }> {
    try {
      const queueEntry = await databases.getDocument<QueueEntry>(
        DATABASE_ID,
        COLLECTIONS.MATCHMAKING_QUEUE,
        documentId,
      );

      if (queueEntry.status === "matched" && queueEntry.matchedWith) {
        // Find the game room created for this match
        const gameRooms = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.GAME_ROOMS,
          [
            Query.or([
              Query.equal("player1Id", queueEntry.userId),
              Query.equal("player2Id", queueEntry.userId),
            ]),
            Query.or([
              Query.equal("status", "waiting"),
              Query.equal("status", "active"),
            ]),
            Query.orderDesc("$createdAt"),
            Query.limit(1),
          ],
        );

        if (gameRooms.total > 0) {
          return {
            matched: true,
            gameRoomId: gameRooms.documents[0].$id,
          };
        }
      }

      return { matched: false };
    } catch (error) {
      console.error("Error checking match:", error);
      return { matched: false };
    }
  }

  /**
   * Create a battle room with invite code
   */
  static async createBattleRoom(
    hostId: string,
    hostUsername: string,
    hostTier: number,
    config: GameConfiguration,
  ): Promise<BattleRoom> {
    try {
      const inviteCode = this.generateInviteCode();

      const room = await databases.createDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        ID.unique(),
        {
          roomId: ID.unique(),
          inviteCode,
          hostId,
          hostUsername,
          hostTier,
          opponentId: null,
          opponentUsername: null,
          opponentTier: null,
          subject: config.subject,
          duration: config.duration,
          status: "waiting",
          hostReady: false,
          opponentReady: false,
          gameRoomId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );

      return room;
    } catch (error) {
      console.error("Error creating battle room:", error);
      throw new Error("Failed to create battle room");
    }
  }

  /**
   * Join a battle room with invite code
   */
  static async joinBattleRoom(
    inviteCode: string,
    userId: string,
    username: string,
    tier: number,
  ): Promise<BattleRoom> {
    try {
      // Find room by invite code
      const rooms = await databases.listDocuments<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        [
          Query.equal("inviteCode", inviteCode.toUpperCase().trim()),
          Query.limit(1),
        ],
      );

      if (rooms.total === 0) {
        throw new Error("Invalid room code. Please check and try again.");
      }

      const room = rooms.documents[0];

      // Validate room state
      if (room.status === "starting" || room.status === "active") {
        throw new Error("This game has already started.");
      }

      if (room.status === "cancelled") {
        throw new Error("This room has been cancelled.");
      }

      // Check if user is the host
      if (room.hostId === userId) {
        throw new Error("You cannot join your own room.");
      }

      // Check if room already has opponent
      if (room.opponentId && room.opponentId !== userId) {
        throw new Error("This room is full.");
      }

      // If opponent is rejoining (same userId), don't update
      if (room.opponentId === userId) {
        return room;
      }

      // Update room with opponent
      const updatedRoom = await databases.updateDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        room.$id,
        {
          opponentId: userId,
          opponentUsername: username,
          opponentTier: tier,
          updatedAt: new Date().toISOString(),
        },
      );

      return updatedRoom;
    } catch (error) {
      console.error("Error joining battle room:", error);
      throw error;
    }
  }

  /**
   * Set player ready status in battle room
   */
  static async setReady(
    battleRoomId: string,
    userId: string,
    isReady: boolean,
  ): Promise<BattleRoom> {
    try {
      const room = await databases.getDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        battleRoomId,
      );

      if (!room) {
        throw new Error("Battle room not found");
      }

      // Determine if user is host or opponent
      const isHost = room.hostId === userId;
      const isOpponent = room.opponentId === userId;

      if (!isHost && !isOpponent) {
        throw new Error("You are not a participant in this room");
      }

      // Update ready status
      const updatedRoom = await databases.updateDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        battleRoomId,
        {
          [isHost ? "hostReady" : "opponentReady"]: isReady,
          updatedAt: new Date().toISOString(),
        },
      );

      return updatedRoom;
    } catch (error) {
      console.error("Error setting ready status:", error);
      throw new Error("Failed to update ready status");
    }
  }

  /**
   * Start battle game when both players are ready
   * CRITICAL: Only ONE player should call this (the one who readies last)
   */
  static async startBattleGame(battleRoomId: string): Promise<string> {
    try {
      const room = await databases.getDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        battleRoomId,
      );

      // Validate both players are ready
      if (!room.hostReady || !room.opponentReady) {
        throw new Error("Both players must be ready to start");
      }

      // Validate opponent has joined
      if (!room.opponentId) {
        throw new Error("Waiting for opponent to join");
      }

      // Check if game already created (prevent duplicate creation)
      if (room.gameRoomId) {
        return room.gameRoomId;
      }

      // Update battle room status to "starting" FIRST to prevent race condition
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        battleRoomId,
        {
          status: "starting",
          updatedAt: new Date().toISOString(),
        },
      );

      // 1. Get random questions for the game
      const questionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        [Query.equal("subject", room.subject), Query.limit(5)],
      );

      if (questionsResponse.total === 0) {
        throw new Error("No questions found for this subject.");
      }

      const questionIds = questionsResponse.documents.map((q) => q.$id);

      // Create game room
      const gameRoom = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        ID.unique(),
        {
          roomId: ID.unique(),
          gameType: "battle",
          status: "waiting",
          player1Id: room.hostId,
          player2Id: room.opponentId,
          player1Tier: room.hostTier,
          player2Tier: room.opponentTier,
          player1Score: 0,
          player2Score: 0,
          currentQuestionIndex: 0,
          questions: questionIds,
          subject: room.subject,
          duration: room.duration,
          startTime: null,
          endTime: null,
          winnerId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );

      // Update battle room with game ID
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        battleRoomId,
        {
          gameRoomId: gameRoom.$id,
          status: "active",
          updatedAt: new Date().toISOString(),
        },
      );

      return gameRoom.$id;
    } catch (error) {
      console.error("Error starting battle game:", error);
      throw error;
    }
  }

  /**
   * Cancel battle room
   */
  static async cancelBattleRoom(battleRoomId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        battleRoomId,
        {
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error cancelling battle room:", error);
      throw new Error("Failed to cancel room");
    }
  }

  static canSelectTier(userTier: number, targetTier: number): boolean {
    // User can only select tiers equal to or lower than their own
    // Remember: Lower number = higher tier (Tier 1 is best, Tier 10 is basic)
    return targetTier <= userTier;
  }

  private static generateInviteCode(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
