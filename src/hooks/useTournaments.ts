import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TournamentService } from "@/services/tournament.service";
import type {
  CreateTournamentInput,
  TournamentStatus,
} from "@/types/tournament.types";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function useTournaments(status?: TournamentStatus) {
  return useQuery({
    queryKey: ["tournaments", status],
    queryFn: () => TournamentService.getTournaments(status as any),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useUserTournaments() {
  const profile = useAuthStore((state) => state.profile);

  return useQuery({
    queryKey: ["userTournaments", profile?.userId],
    queryFn: () => TournamentService.getUserTournaments(profile!.userId),
    enabled: !!profile?.userId,
    staleTime: 30000,
  });
}

export function useTournament(tournamentId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => TournamentService.getTournament(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 10000, // 10 seconds (more frequent for active tournaments)
  });
}

export function useCreateTournament() {
  const profile = useAuthStore((state) => state.profile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTournamentInput) => {
      if (!profile) throw new Error("User profile not found");

      return TournamentService.createTournament(
        profile.userId,
        profile.username,
        profile.tier,
        input,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["userTournaments"] });
      toast.success("Tournament created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tournament");
    },
  });
}

export function useJoinTournament() {
  const profile = useAuthStore((state) => state.profile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tournamentId: string) => {
      if (!profile) throw new Error("User profile not found");

      return TournamentService.joinTournament(
        tournamentId,
        profile.userId,
        profile.username,
        profile.tier,
        profile.profile_image, // Use profile_image instead of avatarUrl if that's what we have
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["userTournaments"] });
      toast.success("Joined tournament!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to join tournament");
    },
  });
}

export function useLeaveTournament() {
  const profile = useAuthStore((state) => state.profile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tournamentId: string) => {
      if (!profile) throw new Error("User not authenticated");

      return TournamentService.leaveTournament(tournamentId, profile.userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["userTournaments"] });
      toast.success("Left tournament");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to leave tournament");
    },
  });
}

export function useSearchTournaments(query: string) {
  return useQuery({
    queryKey: ["tournaments", "search", query],
    queryFn: () => TournamentService.searchTournaments(query),
    enabled: query.length >= 2,
  });
}
