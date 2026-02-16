import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Share2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameConfiguration } from "@/types/play.types";
import { SUBJECTS } from "@/types/play.types";
import { toast } from "sonner";

interface WaitingRoomProps {
  config: GameConfiguration;
  timeElapsed: number;
  progress: number;
  onCancel: () => void;
  inviteCode?: string;
  isSearching: boolean;
  opponentJoined?: boolean;
  isReady?: boolean;
  onReady?: () => void;
}

export function WaitingRoom({
  config,
  timeElapsed,
  progress,
  onCancel,
  inviteCode,
  isSearching,
  opponentJoined,
  isReady,
  onReady,
}: WaitingRoomProps) {
  const subject = SUBJECTS.find((s) => s.id === config.subject);
  const minutes = Math.floor(config.duration / 60);

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success("Code copied to clipboard!");
    }
  };

  const shareCode = () => {
    if (inviteCode && navigator.share) {
      navigator.share({
        title: "Join my Brainiak game!",
        text: `Hey! Challenge me on Brainiak. Use code ${inviteCode} to join my room.`,
        url: window.location.origin + "/play",
      });
    }
  };

  return (
    <AnimatePresence>
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl ring-1 ring-white/10 overflow-hidden relative"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[80px] -z-10" />

            {/* Animated Spinner */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-blue-500"
                    strokeDasharray={376.8}
                    initial={{ strokeDashoffset: 376.8 }}
                    animate={{ strokeDashoffset: 376.8 * (1 - progress / 100) }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>

                {/* Brain/Swords Icon in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-5xl"
                  >
                    {inviteCode ? (
                      <Swords className="w-12 h-12 text-orange-500" />
                    ) : (
                      "🧠"
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
              {inviteCode
                ? opponentJoined
                  ? "Opponent Joined!"
                  : "Waiting for Friend"
                : "Seeking Opponent"}
            </h2>

            {/* Subtitle */}
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm font-bold uppercase tracking-widest">
              {inviteCode
                ? opponentJoined
                  ? "Get ready to battle!"
                  : "Share your code to start the battle"
                : "Initializing neural network connection..."}
            </p>

            {/* Ready Button for Battle Mode */}
            {inviteCode && opponentJoined && (
              <div className="mb-8 px-4">
                <Button
                  onClick={onReady}
                  disabled={isReady}
                  className={`w-full h-16 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all duration-300 shadow-xl ${
                    isReady
                      ? "bg-green-500 text-white shadow-green-500/20"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-[1.02] shadow-blue-500/20"
                  }`}
                >
                  {isReady ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Ready to Fight
                    </div>
                  ) : (
                    "Click to Ready"
                  )}
                </Button>
              </div>
            )}

            {/* Invite Code (Battle Mode - only if opponent not joined) */}
            {inviteCode && !opponentJoined && (
              <div className="mb-8 text-center space-y-4">
                <div className="text-5xl font-black font-mono tracking-[0.2em] text-blue-500 bg-blue-50 dark:bg-blue-900/20 py-6 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/50">
                  {inviteCode}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
                    onClick={copyCode}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
                    onClick={shareCode}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            )}

            {/* Game Info Chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {config.mode}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span className="text-xs">{subject?.icon}</span>
                {subject?.name}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span>⏱️ {minutes} MIN</span>
              </div>
            </div>

            {/* Timer Status */}
            {!inviteCode && (
              <div className="text-center mb-8">
                <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                  Time Elapsed
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  {timeElapsed.toString().padStart(2, "0")}{" "}
                  <span className="text-blue-500">/ 30S</span>
                </div>
              </div>
            )}

            {/* Cancel Button */}
            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full h-12 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-black uppercase text-[10px] tracking-widest gap-2 transition-all"
            >
              <X className="w-4 h-4" />
              Abort Mission
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
