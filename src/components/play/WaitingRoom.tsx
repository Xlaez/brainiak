import { motion, AnimatePresence } from "framer-motion";
import { X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameConfiguration } from "@/types/play.types";
import { SUBJECTS } from "@/types/play.types";

interface WaitingRoomProps {
  config: GameConfiguration;
  timeElapsed: number;
  progress: number;
  onCancel: () => void;
  isSearching: boolean;
}

export function WaitingRoom({
  config,
  timeElapsed,
  progress,
  onCancel,
  isSearching,
}: WaitingRoomProps) {
  const subject = SUBJECTS.find((s) => s.id === config.subject);
  const minutes = Math.floor(config.duration / 60);

  return (
    <AnimatePresence>
      {isSearching && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl ring-1 ring-white/10 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[80px] -z-10" />

            {/* Animated Spinner */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="76"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="76"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-blue-500"
                    strokeDasharray={477.5}
                    initial={{ strokeDashoffset: 477.5 }}
                    animate={{ strokeDashoffset: 477.5 * (1 - progress / 100) }}
                    transition={{ duration: 1, ease: "linear" }}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Brain Icon in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center"
                  >
                    <Brain className="w-8 h-8 text-blue-500" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
              Seeking Opponent
            </h2>

            {/* Subtitle */}
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-[10px] font-black uppercase tracking-[0.4em]">
              Neural synchronization in progress
            </p>

            {/* Game Info Chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {config.mode}
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="text-xs">{subject?.icon}</span>
                {subject?.name}
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-center gap-1">
                ⏱️ {minutes} MIN
              </div>
            </div>

            {/* Timer Status */}
            <div className="text-center mb-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
                Connection Uptime
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {timeElapsed.toString().padStart(2, "0")}{" "}
                <span className="text-blue-500">/ 30S</span>
              </div>
            </div>

            {/* Cancel Button */}
            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full h-14 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-500/5 font-black uppercase text-[10px] tracking-[0.2em] gap-2 transition-all"
            >
              <X className="w-4 h-4" />
              Abort Protocol
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
