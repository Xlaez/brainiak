import { account, databases, COLLECTIONS, DATABASE_ID } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import type { UserProfile } from "@/types/profile.types";

export const authService = {
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.equal("userId", userId)],
      );
      return response.documents[0] as unknown as UserProfile;
    } catch (error) {
      return null;
    }
  },

  async createProfile(userId: string, username: string, country: string) {
    const profileData = {
      userId,
      username,
      country,
      tier: 10,
      totalPoints: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        userId, // Use userId as document ID for easier retrieval and uniqueness
        profileData,
      );
    } catch (error: any) {
      if (error.code === 409) {
        // Profile already exists, just return the existing one
        return await this.getUserProfile(userId);
      }
      throw error;
    }
  },

  async signup(email: string, pass: string, name: string) {
    try {
      // Try to clear any existing sessions first to avoid "session active" error
      await this.logout();
    } catch (e) {
      // Ignore errors if no session exists
    }

    try {
      await account.create(ID.unique(), email, pass, name);
    } catch (error: any) {
      // If user already exists, we can proceed to login
      // instead of throwing error, but usually better to let user know
      if (error.code !== 409) {
        throw error;
      }
    }

    return await this.login(email, pass);
  },

  async login(email: string, pass: string) {
    try {
      // Try to clear any existing sessions first
      await this.logout();
    } catch (e) {
      // Ignore
    }
    return await account.createEmailPasswordSession(email, pass);
  },

  async logout() {
    try {
      await account.deleteSession("current");
    } catch (error) {
      // Session might not exist, that's fine
    }
  },
};
