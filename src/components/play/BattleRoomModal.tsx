import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BattleRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
  isLoading: boolean;
}

export function BattleRoomModal({
  isOpen,
  onClose,
  onJoin,
  isLoading,
}: BattleRoomModalProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onJoin(code.toUpperCase());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[251] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden pointer-events-auto ring-1 ring-white/10"
            >
              <div className="relative p-8">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                    <Swords className="w-8 h-8 text-orange-500" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      Join Battle
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      Enter the 6-digit room code to join your friend's game.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Room Invite Code
                      </Label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        maxLength={6}
                        className="h-16 text-center text-3xl font-black font-mono tracking-[0.3em] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-orange-500 focus:ring-0 transition-all uppercase placeholder:text-slate-200 dark:placeholder:text-slate-800"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={code.length !== 6 || isLoading}
                      className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Engage Combat"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
