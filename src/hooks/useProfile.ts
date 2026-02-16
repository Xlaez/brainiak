import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/services/profile.service";
import type { UserProfile } from "@/types/profile.types";

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => ProfileService.getUserProfile(userId),
    staleTime: 60000,
    gcTime: 300000,
    enabled: !!userId,
    retry: 2,
  });
}

export function useRecentMatches(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: ["recentMatches", userId, limit],
    queryFn: () => ProfileService.getRecentMatches(userId, limit),
    staleTime: 30000,
    enabled: !!userId,
  });
}

export function useSubjectPerformance(userId: string) {
  return useQuery({
    queryKey: ["subjectPerformance", userId],
    queryFn: () => ProfileService.getSubjectPerformance(userId),
    staleTime: 60000,
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<UserProfile>;
    }) => ProfileService.updateProfile(userId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
      });
    },
  });
}
