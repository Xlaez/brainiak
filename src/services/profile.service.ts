import {
  databases,
  DATABASE_ID,
  COLLECTIONS,
  storage,
  BUCKET_ID,
} from "@/lib/appwrite";
import { Query, ID, Permission, Role } from "appwrite";
import type {
  UserProfile,
  RecentMatch,
  SubjectPerformance,
} from "@/types/profile.types";

export class ProfileService {
  static async uploadFile(file: File) {
    try {
      // Explicitly grant read access to everyone for this file
      return await storage.createFile(BUCKET_ID, ID.unique(), file, [
        Permission.read(Role.any()),
      ]);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  static getFilePreview(fileId: string) {
    if (!fileId) return "";
    try {
      // Use getFileView to get the raw image without transformations (prevents 403 on free plans)
      const url = storage.getFileView(BUCKET_ID, fileId);

      console.log(
        `[Brainiak Debug] Generating View URL for ${fileId}:`,
        url.toString(),
      );
      return url.toString();
    } catch (error) {
      console.error("Error generating view URL:", error);
      return "";
    }
  }

  static getImageUrl(imageSource?: string) {
    if (!imageSource || typeof imageSource !== "string") return "";

    if (imageSource.startsWith("http") || imageSource.startsWith("data:")) {
      return imageSource;
    }

    return ProfileService.getFilePreview(imageSource);
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await databases.listDocuments<UserProfile>(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("userId", userId), Query.limit(1)],
      );

      if (response.total === 0) {
        return null;
      }

      return response.documents[0];
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  static async getRecentMatches(
    userId: string,
    limit: number = 10,
  ): Promise<RecentMatch[]> {
    try {
      const player1Games = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        [
          Query.equal("player1Id", userId),
          Query.equal("status", "completed"),
          Query.orderDesc("endTime"),
          Query.limit(limit),
        ],
      );

      const player2Games = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        [
          Query.equal("player2Id", userId),
          Query.equal("status", "completed"),
          Query.orderDesc("endTime"),
          Query.limit(limit),
        ],
      );

      const allGames = [...player1Games.documents, ...player2Games.documents]
        .sort(
          (a: any, b: any) =>
            new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
        )
        .slice(0, limit);

      const matches: RecentMatch[] = await Promise.all(
        allGames.map(async (game: any) => {
          const isPlayer1 = game.player1Id === userId;
          const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
          const userScore = isPlayer1 ? game.player1Score : game.player2Score;
          const opponentScore = isPlayer1
            ? game.player2Score
            : game.player1Score;

          const opponentProfile = await this.getUserProfile(opponentId);

          let result: "won" | "lost" | "draw";
          if (userScore > opponentScore) result = "won";
          else if (userScore < opponentScore) result = "lost";
          else result = "draw";

          const pointsChanged = this.calculatePointsChange(
            game,
            userId,
            result,
          );

          return {
            matchId: game.$id,
            opponentId,
            opponentUsername: opponentProfile?.username || "Unknown",
            opponentTier: opponentProfile?.tier || 10,
            opponent_profile_image: opponentProfile?.profile_image,
            subject: game.subject,
            result,
            userScore,
            opponentScore,
            pointsChanged,
            gameType: game.gameType,
            playedAt: game.endTime,
            relativeTime: this.getRelativeTime(game.endTime),
          };
        }),
      );

      return matches;
    } catch (error: any) {
      console.error("Error fetching recent matches:", error);
      return [];
    }
  }

  static async getSubjectPerformance(
    userId: string,
  ): Promise<SubjectPerformance[]> {
    try {
      const player1Games = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        [
          Query.equal("player1Id", userId),
          Query.equal("status", "completed"),
          Query.limit(100),
        ],
      );

      const player2Games = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.GAME_ROOMS,
        [
          Query.equal("player2Id", userId),
          Query.equal("status", "completed"),
          Query.limit(100),
        ],
      );

      const allGames = [...player1Games.documents, ...player2Games.documents];
      const subjectMap = new Map<string, { won: number; total: number }>();

      allGames.forEach((game: any) => {
        const isPlayer1 = game.player1Id === userId;
        const userScore = isPlayer1 ? game.player1Score : game.player2Score;
        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
        const won = userScore > opponentScore;

        const subject = game.subject;
        const current = subjectMap.get(subject) || { won: 0, total: 0 };

        subjectMap.set(subject, {
          won: current.won + (won ? 1 : 0),
          total: current.total + 1,
        });
      });

      return Array.from(subjectMap.entries())
        .map(([subject, stats]) => ({
          subject,
          gamesPlayed: stats.total,
          gamesWon: stats.won,
          gamesLost: stats.total - stats.won,
          winRate: (stats.won / stats.total) * 100,
        }))
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    } catch (error: any) {
      console.error("Error calculating subject performance:", error);
      return [];
    }
  }

  static async updateProfile(
    userId: string,
    data: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const existingProfile = await this.getUserProfile(userId);
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    return await databases.updateDocument<UserProfile>(
      DATABASE_ID,
      COLLECTIONS.USERS_PROFILE,
      existingProfile.$id,
      {
        ...data,
      },
    );
  }

  private static calculatePointsChange(
    _game: any,
    _userId: string,
    result: "won" | "lost" | "draw",
  ): number {
    const BASE_WIN_POINTS = 20;
    const BASE_LOSS_POINTS = 10;

    if (result === "won") return BASE_WIN_POINTS;
    if (result === "lost") return -BASE_LOSS_POINTS;
    return 5;
  }

  private static getRelativeTime(isoDate: string): string {
    const now = new Date();
    const date = new Date(isoDate);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }
}
