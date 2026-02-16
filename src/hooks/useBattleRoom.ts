import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayService } from "@/services/play.service";
import { client, DATABASE_ID, COLLECTIONS, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import type { BattleRoom, GameConfiguration } from "@/types/play.types";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "@tanstack/react-router";

export function useBattleRoom(roomId?: string) {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [room, setRoom] = useState<BattleRoom | null>(null);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.BATTLE_ROOMS}.documents.${roomId}`,
      (response) => {
        const updatedRoom = response.payload as BattleRoom;
        setRoom(updatedRoom);

        // Check if game is starting
        if (updatedRoom.status === "starting") {
          checkForGameRoom();
        }
      },
    );

    return () => unsubscribe();
  }, [roomId]);

  const checkForGameRoom = async () => {
    if (!user) return;

    // Poll for game room creation
    const maxAttempts = 10;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const gameRooms = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.GAME_ROOMS,
          [
            Query.or([
              Query.equal("player1Id", user.$id),
              Query.equal("player2Id", user.$id),
            ]),
            Query.equal("gameType", "battle"),
            Query.orderDesc("$createdAt"),
            Query.limit(1),
          ],
        );

        if (gameRooms.total > 0) {
          clearInterval(interval);
          navigate({ to: `/game/${gameRooms.documents[0].$id}` });
        }
      } catch (e) {
        console.error("Error polling for game room:", e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);
  };

  const createRoom = useMutation({
    mutationFn: (config: GameConfiguration) => {
      if (!user) throw new Error("User not authenticated");
      const username = profile?.username || user.name || "Gamer";
      const tier = profile?.tier || 10;

      return PlayService.createBattleRoom(user.$id, username, tier, config);
    },
    onSuccess: (newRoom) => {
      setRoom(newRoom);
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
    },
  });

  const setReady = useMutation({
    mutationFn: ({
      roomDocId,
      isReady,
    }: {
      roomDocId: string;
      isReady: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      return PlayService.setReady(roomDocId, user.$id, isReady);
    },
  });

  const startGame = useMutation({
    mutationFn: (roomDocId: string) => PlayService.startBattleGame(roomDocId),
    onSuccess: (gameRoomId) => {
      navigate({ to: `/game/${gameRoomId}` });
    },
  });

  const leaveRoom = useMutation({
    mutationFn: (roomDocId: string) => PlayService.leaveBattleRoom(roomDocId),
    onSuccess: () => {
      setRoom(null);
      createRoom.reset();
      joinRoom.reset();
    },
  });

  return {
    room,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    leaveRoom,
  };
}
