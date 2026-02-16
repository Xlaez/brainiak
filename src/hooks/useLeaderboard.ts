import { useQuery } from "@tanstack/react-query";
import { LeaderboardService } from "@/services/leaderboard.service";
import type {
  LeaderboardType,
  LeaderboardFilters,
} from "@/types/leaderboard.types";

export function useLeaderboard(
  type: LeaderboardType,
  country?: string,
  filters?: LeaderboardFilters,
  limit: number = 100,
  offset: number = 0,
) {
  return useQuery({
    queryKey: ["leaderboard", type, country, filters, limit, offset],
    queryFn: () => {
      if (type === "global") {
        return LeaderboardService.getGlobalLeaderboard(limit, offset, filters);
      } else {
        if (!country)
          throw new Error("Country required for regional leaderboard");
        return LeaderboardService.getRegionalLeaderboard(
          country,
          limit,
          offset,
          filters,
        );
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

export function useUserRank(
  type: LeaderboardType,
  userId: string,
  country?: string,
) {
  return useQuery({
    queryKey: ["userRank", type, userId, country],
    queryFn: () => {
      if (type === "global") {
        return LeaderboardService.getUserGlobalRank(userId);
      } else {
        if (!country) throw new Error("Country required for regional rank");
        return LeaderboardService.getUserRegionalRank(userId, country);
      }
    },
    staleTime: 60000, // 1 minute
    enabled: !!userId,
  });
}

export function useTop3Players(type: LeaderboardType, country?: string) {
  return useQuery({
    queryKey: ["top3", type, country],
    queryFn: () => LeaderboardService.getTop3Players(type, country),
    staleTime: 60000, // 1 minute
  });
}
