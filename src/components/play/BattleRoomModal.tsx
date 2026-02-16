import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, X, Check, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBattleRoom } from "@/hooks/useBattleRoom";
import type { GameConfiguration } from "@/types/play.types";
import { SUBJECTS, DURATIONS } from "@/types/play.types";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

interface BattleRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "join";
  config?: GameConfiguration;
}

export function BattleRoomModal({
  isOpen,
  onClose,
  mode,
  config,
}: BattleRoomModalProps) {
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [currentBattleRoomId, setCurrentBattleRoomId] = useState<string | null>(
    null,
  );

  const battleRoom = useBattleRoom(currentBattleRoomId || undefined);

  // Create room on mount if in create mode
  useEffect(() => {
    if (isOpen && mode === "create" && config && !currentBattleRoomId) {
      battleRoom.createRoom.mutate(config, {
        onSuccess: (room) => {
          setCurrentBattleRoomId(room.$id);
        },
      });
    }
  }, [isOpen, mode, config]);

  const handleJoinRoom = () => {
    if (!inviteCodeInput.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    battleRoom.joinRoom.mutate(inviteCodeInput.trim().toUpperCase(), {
      onSuccess: (room) => {
        setCurrentBattleRoomId(room.$id);
      },
    });
  };

  const handleCopyCode = () => {
    if (battleRoom.room?.inviteCode) {
      navigator.clipboard.writeText(battleRoom.room.inviteCode);
      toast.success("Code copied to clipboard!");
    }
  };

  const handleShare = async () => {
    if (!battleRoom.room?.inviteCode) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Brainiak Battle!",
          text: `Use code ${battleRoom.room.inviteCode} to join my game on Brainiak!`,
          url: window.location.origin,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopyCode();
    }
  };

  const handleClose = () => {
    if (currentBattleRoomId) {
      battleRoom.cancelRoom();
    }
    setCurrentBattleRoomId(null);
    setInviteCodeInput("");
    onClose();
  };

  const subject = config
    ? SUBJECTS.find((s) => s.id === config.subject)
    : battleRoom.room
      ? SUBJECTS.find((s) => s.id === battleRoom.room?.subject)
      : null;

  const duration = config
    ? DURATIONS.find((d) => d.value === config.duration)
    : battleRoom.room
      ? DURATIONS.find((d) => d.value === battleRoom.room?.duration)
      : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden ring-1 ring-white/10"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {mode === "create" ? "War Room" : "Join Combat"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  {currentBattleRoomId ? "Waiting for Entry" : "Neural Linkage"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Join Mode: Enter Code */}
            {mode === "join" && !currentBattleRoomId && (
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Neural Invite Code
                  </label>
                  <Input
                    value={inviteCodeInput}
                    onChange={(e) =>
                      setInviteCodeInput(e.target.value.toUpperCase())
                    }
                    placeholder="ABC123"
                    maxLength={6}
                    className="h-20 text-center text-4xl font-black font-mono tracking-[0.3em] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl focus:border-blue-500 focus:ring-0 transition-all uppercase placeholder:text-slate-200 dark:placeholder:text-slate-800"
                  />
                </div>

                {battleRoom.error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
                  >
                    <p className="text-xs text-red-500 font-bold text-center">
                      {battleRoom.error}
                    </p>
                  </motion.div>
                )}

                <Button
                  onClick={handleJoinRoom}
                  disabled={
                    inviteCodeInput.length !== 6 ||
                    battleRoom.joinRoom.isPending
                  }
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {battleRoom.joinRoom.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Engage Link"
                  )}
                </Button>
              </div>
            )}

            {/* Waiting Room Content */}
            {currentBattleRoomId && battleRoom.room && (
              <div className="relative space-y-8">
                {/* Invite Code Display */}
                <div className="text-center space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {battleRoom.isHost
                      ? "Neutral Access Key"
                      : "Handshake Established"}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <div className="text-5xl font-black font-mono tracking-widest text-blue-500 bg-blue-500/10 px-8 py-6 rounded-[2rem] ring-1 ring-blue-500/20">
                      {battleRoom.room.inviteCode}
                    </div>

                    {battleRoom.isHost && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCopyCode}
                          className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                        >
                          <Copy className="w-5 h-5" />
                        </Button>

                        {typeof navigator !== "undefined" &&
                          typeof navigator.share === "function" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleShare}
                              className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                            >
                              <Share2 className="w-5 h-5" />
                            </Button>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Configuration Summary */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                      {subject?.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                        Subject
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                        {subject?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                        Duration
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {duration?.label.split(" ")[0]} Min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participant Status */}
                <div className="space-y-3">
                  {/* Host */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-3xl transition-all ${
                      battleRoom.room.hostReady
                        ? "bg-green-500/10 ring-2 ring-green-500/30"
                        : "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        username={battleRoom.room.hostUsername}
                        size="sm"
                      />
                      <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">
                        {battleRoom.room.hostUsername}
                        {battleRoom.isHost && (
                          <span className="ml-2 text-[8px] opacity-50">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>

                    {battleRoom.room.hostReady ? (
                      <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                        <Check className="w-4 h-4 stroke-[4]" />
                        Ready
                      </div>
                    ) : (
                      <Clock className="w-4 h-4 text-slate-300 animate-pulse" />
                    )}
                  </div>

                  {/* Opponent */}
                  {battleRoom.opponentJoined ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 rounded-3xl transition-all ${
                        battleRoom.room.opponentReady
                          ? "bg-green-500/10 ring-2 ring-green-500/30"
                          : "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          username={
                            battleRoom.room.opponentUsername || "Opponent"
                          }
                          size="sm"
                        />
                        <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">
                          {battleRoom.room.opponentUsername}
                          {battleRoom.isOpponent && (
                            <span className="ml-2 text-[8px] opacity-50">
                              (You)
                            </span>
                          )}
                        </span>
                      </div>

                      {battleRoom.room.opponentReady ? (
                        <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                          <Check className="w-4 h-4 stroke-[4]" />
                          Ready
                        </div>
                      ) : (
                        <Clock className="w-4 h-4 text-slate-300 animate-pulse" />
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-300 mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Awaiting Challenger
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="space-y-4">
                  <Button
                    onClick={() => battleRoom.toggleReady.mutate()}
                    disabled={
                      !battleRoom.opponentJoined ||
                      battleRoom.toggleReady.isPending ||
                      battleRoom.bothReady
                    }
                    className={`w-full h-20 font-black uppercase text-sm tracking-[0.2em] rounded-[2rem] shadow-2xl transition-all ${
                      battleRoom.isReady
                        ? "bg-green-500 text-white shadow-green-500/20"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-95"
                    }`}
                  >
                    {battleRoom.toggleReady.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : battleRoom.bothReady ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] mb-1 opacity-60">
                          Neural Bridge Active
                        </span>
                        <span>Initializing...</span>
                      </div>
                    ) : battleRoom.isReady ? (
                      "Waiting for Peer"
                    ) : battleRoom.opponentJoined ? (
                      "Engage Ready State"
                    ) : (
                      "Challenger Required"
                    )}
                  </Button>

                  <button
                    onClick={handleClose}
                    disabled={battleRoom.bothReady}
                    className="w-full text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-[0.3em] transition-colors py-2"
                  >
                    Abort Interface
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
