import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import type {
  GameConfiguration,
  QueueEntry,
  BattleRoom,
} from "@/types/play.types";

export class PlayService {
  /**
   * Join matchmaking queue for Classic or Control mode
   */
  static async joinQueue(
    userId: string,
    username: string,
    tier: number,
    config: GameConfiguration,
  ): Promise<QueueEntry> {
    try {
      // 1. Cleanup ANY existing entry for this user by their ID
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

      // 2. Also cleanup by Query just in case there are orphaned entries with random IDs
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

      // 3. Create the new queue entry using userId as the Document ID
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

      // 4. Immediately try to find a match
      console.log(
        `[PlayService] Searching for compatible opponents for ${userId}...`,
      );
      await this.findMatch(newEntry);

      return newEntry;
    } catch (error: any) {
      console.error("Error joining queue:", error);
      throw new Error(error.message || "Failed to join matchmaking queue");
    }
  }

  /**
   * Internal method to find and link with an opponent
   */
  private static async findMatch(userEntry: QueueEntry): Promise<void> {
    try {
      // Look for opponents with same settings who are 'waiting'
      const queries = [
        Query.equal("status", "waiting"),
        Query.equal("gameType", userEntry.gameType),
        Query.equal("subject", userEntry.subject),
        Query.equal("duration", userEntry.duration),
        Query.notEqual("userId", userEntry.userId), // Don't match with self
        Query.limit(1), // Just one for now
      ];

      // If control mode, check if we match their selected tier
      // (This is a bit simplified: matching logic for Control mode could be more complex)

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

        // We found them, so WE are the host for the game room
        // 1. Get random questions for the game
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

        // 2. Create the Game Room
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
            startTime: new Date().toISOString(),
          },
        );

        // 3. Update BOTH queue entries to matched
        // Update Opponent first so they get the notification
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.MATCHMAKING_QUEUE,
          opponent.$id,
          {
            status: "matched",
            matchedWith: userEntry.userId,
          },
        );

        // Update Self
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

      return await databases.createDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        ID.unique(),
        {
          roomId: ID.unique(),
          inviteCode,
          hostId,
          hostUsername,
          hostTier,
          subject: config.subject,
          duration: config.duration,
          status: "waiting",
          hostReady: false,
          opponentReady: false,
          createdAt: new Date().toISOString(),
        },
      );
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
          Query.equal("inviteCode", inviteCode.toUpperCase()),
          Query.equal("status", "waiting"),
          Query.limit(1),
        ],
      );

      if (rooms.total === 0) {
        throw new Error("Room not found or already started");
      }

      const room = rooms.documents[0];

      // Check if user is the host
      if (room.hostId === userId) {
        throw new Error("You are already the host of this room");
      }

      // Check if room already has opponent
      if (room.opponentId) {
        throw new Error("Room is full");
      }

      // Update room with opponent
      return await databases.updateDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        room.$id,
        {
          opponentId: userId,
          opponentUsername: username,
          opponentTier: tier,
        },
      );
    } catch (error: any) {
      console.error("Error joining battle room:", error);
      throw error;
    }
  }

  /**
   * Set player ready status in battle room
   */
  static async setReady(
    documentId: string,
    userId: string,
    isReady: boolean,
  ): Promise<void> {
    try {
      const room = await databases.getDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        documentId,
      );

      const isHost = room.hostId === userId;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        documentId,
        {
          [isHost ? "hostReady" : "opponentReady"]: isReady,
        },
      );
    } catch (error) {
      console.error("Error setting ready status:", error);
      throw new Error("Failed to update ready status");
    }
  }

  /**
   * Leave or cancel a battle room
   */
  static async leaveBattleRoom(documentId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        documentId,
        { status: "cancelled" },
      );
    } catch (error) {
      console.error("Error leaving battle room:", error);
      throw new Error("Failed to leave battle room");
    }
  }

  /**
   * Start game when both players are ready
   */
  static async startBattleGame(documentId: string): Promise<string> {
    try {
      const room = await databases.getDocument<BattleRoom>(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        documentId,
      );

      if (!room.hostReady || !room.opponentReady) {
        throw new Error("Both players must be ready");
      }

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
          subject: room.subject,
          duration: room.duration,
          player1Score: 0,
          player2Score: 0,
          currentQuestionIndex: 0,
          createdAt: new Date().toISOString(),
        },
      );

      // Update battle room status
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BATTLE_ROOMS,
        documentId,
        { status: "starting" },
      );

      return gameRoom.$id;
    } catch (error) {
      console.error("Error starting battle game:", error);
      throw new Error("Failed to start game");
    }
  }

  /**
   * Validate user can select a tier (Control mode)
   */
  static canSelectTier(userTier: number, targetTier: number): boolean {
    // User can only select tiers equal to or lower than their own
    // Remember: Lower number = higher tier (Tier 1 is best, Tier 10 is basic)
    // Wait, the instruction says: "Tier 7 user can only select Tier 1-7"
    // So targetTier should be less than or equal to userTier?
    // Let's re-read: "VALIDATION: Can only select tier ≤ their own tier (cannot select lower tiers)"
    // If I'm Tier 7, I can select 1, 2, 3, 4, 5, 6, 7.
    // 8, 9, 10 are "lower" tiers (higher numbers).
    // So targetTier <= userTier is correct.
    return targetTier <= userTier;
  }

  /**
   * Generate random 6-character invite code
   */
  private static generateInviteCode(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
