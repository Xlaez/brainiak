// src/services/leaderboard.service.ts

import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { ProfileService } from "./profile.service";
import type {
  LeaderboardPlayer,
  LeaderboardFilters,
  UserRankInfo,
} from "@/types/leaderboard.types";

export class LeaderboardService {
  /**
   * Get global leaderboard
   */
  static async getGlobalLeaderboard(
    limit: number = 100,
    offset: number = 0,
    filters?: LeaderboardFilters,
  ): Promise<LeaderboardPlayer[]> {
    try {
      const queries = [
        Query.orderDesc("totalPoints"),
        Query.limit(limit),
        Query.offset(offset),
      ];

      // Add filters
      if (filters?.tier) {
        queries.push(Query.equal("tier", filters.tier));
      }

      if (filters?.search) {
        queries.push(Query.search("username", filters.search));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        queries,
      );

      // Calculate ranks
      return response.documents.map((doc, index) => ({
        userId: doc.userId,
        username: doc.username,
        country: doc.country,
        tier: doc.tier,
        totalPoints: doc.totalPoints,
        gamesPlayed: doc.gamesPlayed,
        gamesWon: doc.gamesWon,
        winRate: doc.winRate,
        avatarUrl: ProfileService.getImageUrl(doc.profile_image),
        rank: offset + index + 1,
      }));
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      throw new Error("Failed to load global leaderboard");
    }
  }

  /**
   * Get regional leaderboard
   */
  static async getRegionalLeaderboard(
    country: string,
    limit: number = 100,
    offset: number = 0,
    filters?: LeaderboardFilters,
  ): Promise<LeaderboardPlayer[]> {
    try {
      const queries = [
        Query.equal("country", country),
        Query.orderDesc("totalPoints"),
        Query.limit(limit),
        Query.offset(offset),
      ];

      // Add filters
      if (filters?.tier) {
        queries.push(Query.equal("tier", filters.tier));
      }

      if (filters?.search) {
        queries.push(Query.search("username", filters.search));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        queries,
      );

      return response.documents.map((doc, index) => ({
        userId: doc.userId,
        username: doc.username,
        country: doc.country,
        tier: doc.tier,
        totalPoints: doc.totalPoints,
        gamesPlayed: doc.gamesPlayed,
        gamesWon: doc.gamesWon,
        winRate: doc.winRate,
        avatarUrl: ProfileService.getImageUrl(doc.profile_image),
        rank: offset + index + 1,
      }));
    } catch (error) {
      console.error("Error fetching regional leaderboard:", error);
      throw new Error("Failed to load regional leaderboard");
    }
  }

  /**
   * Get user's global rank
   */
  static async getUserGlobalRank(userId: string): Promise<UserRankInfo> {
    try {
      // Get user's points
      const userProfiles = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("userId", userId), Query.limit(1)],
      );

      if (userProfiles.total === 0) {
        throw new Error("User profile not found");
      }

      const userPoints = userProfiles.documents[0].totalPoints;

      // Count players with more points
      const higherRanked = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [
          Query.greaterThan("totalPoints", userPoints),
          Query.limit(1), // We just need the count
        ],
      );

      const rank = higherRanked.total + 1;

      // Get total players
      const totalPlayers = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.limit(1)],
      );

      const percentile =
        ((totalPlayers.total - rank) / totalPlayers.total) * 100;

      return {
        rank,
        totalPlayers: totalPlayers.total,
        percentile: Math.round(percentile * 10) / 10,
      };
    } catch (error) {
      console.error("Error fetching user rank:", error);
      throw new Error("Failed to calculate rank");
    }
  }

  /**
   * Get user's regional rank
   */
  static async getUserRegionalRank(
    userId: string,
    country: string,
  ): Promise<UserRankInfo> {
    try {
      // Get user's points
      const userProfiles = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("userId", userId), Query.limit(1)],
      );

      if (userProfiles.total === 0) {
        throw new Error("User profile not found");
      }

      const userPoints = userProfiles.documents[0].totalPoints;

      // Count players from same country with more points
      const higherRanked = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [
          Query.equal("country", country),
          Query.greaterThan("totalPoints", userPoints),
          Query.limit(1),
        ],
      );

      const rank = higherRanked.total + 1;

      // Get total players in country
      const totalPlayers = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("country", country), Query.limit(1)],
      );

      const percentile =
        ((totalPlayers.total - rank) / totalPlayers.total) * 100;

      return {
        rank,
        totalPlayers: totalPlayers.total,
        percentile: Math.round(percentile * 10) / 10,
      };
    } catch (error) {
      console.error("Error fetching user regional rank:", error);
      throw new Error("Failed to calculate regional rank");
    }
  }

  /**
   * Get top 3 players (for podium)
   */
  static async getTop3Players(
    type: "global" | "regional",
    country?: string,
  ): Promise<LeaderboardPlayer[]> {
    try {
      const queries = [Query.orderDesc("totalPoints"), Query.limit(3)];

      if (type === "regional" && country) {
        queries.push(Query.equal("country", country));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        queries,
      );

      return response.documents.map((doc, index) => ({
        userId: doc.userId,
        username: doc.username,
        country: doc.country,
        tier: doc.tier,
        totalPoints: doc.totalPoints,
        gamesPlayed: doc.gamesPlayed,
        gamesWon: doc.gamesWon,
        winRate: doc.winRate,
        avatarUrl: ProfileService.getImageUrl(doc.profile_image),
        rank: index + 1,
      }));
    } catch (error) {
      console.error("Error fetching top 3:", error);
      return [];
    }
  }
}
