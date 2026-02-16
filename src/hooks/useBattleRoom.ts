import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayService } from "@/services/play.service";
import { client, DATABASE_ID, COLLECTIONS, databases } from "@/lib/appwrite";
import type { BattleRoom, GameConfiguration } from "@/types/play.types";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function useBattleRoom(battleRoomId?: string) {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to room updates
  useEffect(() => {
    if (!battleRoomId) return;

    console.log("[useBattleRoom] Subscribing to battle room:", battleRoomId);

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.BATTLE_ROOMS}.documents.${battleRoomId}`,
      (response) => {
        console.log("[useBattleRoom] Battle room update:", response.payload);
        const updatedRoom = response.payload as BattleRoom;
        setRoom(updatedRoom);

        // Update local ready state
        if (user) {
          const isHost = updatedRoom.hostId === user.$id;
          setIsReady(
            isHost ? updatedRoom.hostReady : updatedRoom.opponentReady,
          );
        }

        // Check if both players are ready and game room is created
        if (
          updatedRoom.hostReady &&
          updatedRoom.opponentReady &&
          updatedRoom.gameRoomId &&
          updatedRoom.status === "active"
        ) {
          console.log(
            "[useBattleRoom] Both ready! Navigating to game room:",
            updatedRoom.gameRoomId,
          );

          // Small delay to ensure database is consistent
          setTimeout(() => {
            navigate({ to: `/game/${updatedRoom.gameRoomId}` });
          }, 500);
        }
      },
    );

    return () => {
      console.log("[useBattleRoom] Unsubscribing from battle room");
      unsubscribe();
    };
  }, [battleRoomId, user, navigate]);

  // Fetch initial room state
  useEffect(() => {
    if (!battleRoomId) return;

    const fetchRoom = async () => {
      try {
        const fetchedRoom = await databases.getDocument<BattleRoom>(
          DATABASE_ID,
          COLLECTIONS.BATTLE_ROOMS,
          battleRoomId,
        );

        setRoom(fetchedRoom);

        // Set initial ready state
        if (user) {
          const isHost = fetchedRoom.hostId === user.$id;
          setIsReady(
            isHost ? fetchedRoom.hostReady : fetchedRoom.opponentReady,
          );
        }
      } catch (err) {
        console.error("[useBattleRoom] Error fetching battle room:", err);
        setError("Failed to load battle room");
      }
    };

    fetchRoom();
  }, [battleRoomId, user]);

  const createRoom = useMutation({
    mutationFn: (config: GameConfiguration) => {
      if (!user) throw new Error("User not authenticated");
      const username = profile?.username || user.name || "Gamer";
      const tier = profile?.tier || 10;

      return PlayService.createBattleRoom(user.$id, username, tier, config);
    },
    onSuccess: (createdRoom) => {
      setRoom(createdRoom);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create room");
    },
  });

  const joinRoom = useMutation({
    mutationFn: (inviteCode: string) => {
      if (!user) throw new Error("User not authenticated");
      const username = profile?.username || user.name || "Gamer";
      const tier = profile?.tier || 10;

      return PlayService.joinBattleRoom(inviteCode, user.$id, username, tier);
    },
    onSuccess: (joinedRoom) => {
      setRoom(joinedRoom);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to join room");
    },
  });

  const toggleReady = useMutation({
    mutationFn: async () => {
      if (!user || !battleRoomId) {
        throw new Error("Missing user or room ID");
      }

      const newReadyState = !isReady;

      // Update ready status
      const updatedRoom = await PlayService.setReady(
        battleRoomId,
        user.$id,
        newReadyState,
      );

      // Check if both players are now ready
      if (updatedRoom.hostReady && updatedRoom.opponentReady) {
        console.log("[useBattleRoom] Both players ready! Starting game...");

        // Only start game if not already started
        if (!updatedRoom.gameRoomId) {
          const gameRoomId = await PlayService.startBattleGame(battleRoomId);
          console.log("[useBattleRoom] Game room created:", gameRoomId);
        }
      }

      return updatedRoom;
    },
    onSuccess: (updatedRoom) => {
      setRoom(updatedRoom);
      setError(null);
    },
    onError: (err: any) => {
      console.error("[useBattleRoom] Error toggling ready:", err);
      toast.error(err.message || "Failed to update ready status");
      setError(err.message || "Failed to update ready status");
    },
  });

  const cancelRoom = useCallback(async () => {
    if (!battleRoomId) return;

    try {
      await PlayService.cancelBattleRoom(battleRoomId);
      navigate({ to: "/play" });
    } catch (err) {
      console.error("[useBattleRoom] Error cancelling room:", err);
      setError("Failed to cancel room");
    }
  }, [battleRoomId, navigate]);

  return {
    room,
    isReady,
    error,
    createRoom,
    joinRoom,
    toggleReady,
    cancelRoom,
    isHost: room && user ? room.hostId === user.$id : false,
    isOpponent: room && user ? room.opponentId === user.$id : false,
    bothReady: room ? room.hostReady && room.opponentReady : false,
    opponentJoined: room ? !!room.opponentId : false,
  };
}
