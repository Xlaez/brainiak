import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayService } from "@/services/play.service";
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import type { GameConfiguration, MatchmakingState } from "@/types/play.types";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const MAX_SEARCH_TIME = 30; // seconds

export function useMatchmaking() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const [state, setState] = useState<MatchmakingState>({
    isSearching: false,
    timeElapsed: 0,
    config: null,
  });

  const [error, setError] = useState<string | null>(null);

  const joinQueueMutation = useMutation({
    mutationFn: async (config: GameConfiguration) => {
      if (!user) throw new Error("User not authenticated");

      const username = profile?.username || user.name || "Gamer";
      const tier = profile?.tier || 10;

      console.log(`[Matchmaking] Joining queue for ${username}...`);
      return PlayService.joinQueue(user.$id, username, tier, config);
    },
    onSuccess: (queueEntry, config) => {
      console.log(`[Matchmaking] Successfully joined queue: ${queueEntry.$id}`);
      setState({
        isSearching: true,
        queueId: queueEntry.$id,
        timeElapsed: 0,
        config,
      });
      setError(null);
    },
    onError: (err: any) => {
      console.error(`[Matchmaking] Join queue failed:`, err);
      toast.error(err.message || "Failed to join matchmaking");
      setError(err.message);
      setState((prev) => ({ ...prev, isSearching: false }));
    },
  });

  // Consolidated searching state
  const isActuallySearching = state.isSearching || joinQueueMutation.isPending;

  // Leave queue on unmount or before starting new search
  useEffect(() => {
    return () => {
      if (state.queueId) {
        console.log(`[Matchmaking] Cleaning up queue: ${state.queueId}`);
        PlayService.leaveQueue(state.queueId).catch(console.error);
      }
    };
  }, [state.queueId]);

  // Timer for search duration
  useEffect(() => {
    if (!state.isSearching) {
      if (state.timeElapsed > 0 && !isActuallySearching) {
        // Reset timer if we stopped searching
        setState((prev) => ({ ...prev, timeElapsed: 0 }));
      }
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const newTime = prev.timeElapsed + 1;

        if (newTime >= MAX_SEARCH_TIME) {
          toast.error("Matchmaking timeout. No opponents found.");
          if (prev.queueId) {
            PlayService.leaveQueue(prev.queueId).catch(console.error);
          }
          return {
            ...prev,
            isSearching: false,
            timeElapsed: 0,
            queueId: undefined,
          };
        }

        return { ...prev, timeElapsed: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isSearching, isActuallySearching]);

  // Subscribe to queue updates (Appwrite Realtime)
  useEffect(() => {
    if (!state.queueId) return;

    console.log(`[Matchmaking] Subscribing to queue: ${state.queueId}`);
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.MATCHMAKING_QUEUE}.documents.${state.queueId}`,
      async (response) => {
        const queueEntry = response.payload as any;
        console.log(
          `[Matchmaking] Queue update for ${state.queueId}:`,
          queueEntry.status,
        );

        if (queueEntry.status === "matched") {
          const result = await PlayService.checkMatch(state.queueId!);

          if (result.matched && result.gameRoomId) {
            toast.success("Match found! Joining game...");
            setState((prev) => ({
              ...prev,
              isSearching: false,
              queueId: undefined,
            }));
            navigate({ to: `/game/${result.gameRoomId}` });
          }
        } else if (queueEntry.status === "cancelled") {
          setState((prev) => ({
            ...prev,
            isSearching: false,
            queueId: undefined,
          }));
        }
      },
    );

    return () => unsubscribe();
  }, [state.queueId, navigate]);

  const cancelSearch = useCallback(async () => {
    if (state.queueId) {
      try {
        await PlayService.leaveQueue(state.queueId);
      } catch (err) {
        console.error("Error cancelling search:", err);
      }
    }

    setState({
      isSearching: false,
      timeElapsed: 0,
      config: null,
      queueId: undefined,
    });
    setError(null);
  }, [state.queueId]);

  return {
    isSearching: isActuallySearching,
    timeElapsed: state.timeElapsed,
    progress: (state.timeElapsed / MAX_SEARCH_TIME) * 100,
    error,
    joinQueue: (config: GameConfiguration) => {
      joinQueueMutation.mutate(config);
    },
    cancelSearch,
    config: state.config,
    reset: () => {
      joinQueueMutation.reset();
      cancelSearch();
    },
  };
}
