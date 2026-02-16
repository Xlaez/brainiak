import { useState, useMemo } from "react";
import { Dices, Target, Swords, Brain, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeCard } from "@/components/play/ModeCard";
import { SubjectSelector } from "@/components/play/SubjectSelector";
import { DurationSelector } from "@/components/play/DurationSelector";
import { TierSelector } from "@/components/play/TierSelector";
import { WaitingRoom } from "@/components/play/WaitingRoom";
import { BattleRoomModal } from "@/components/play/BattleRoomModal";
import { Button } from "@/components/ui/button";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import type {
  GameMode,
  Subject,
  Duration,
  GameConfiguration,
} from "@/types/play.types";
import { toast } from "sonner";

export default function Play() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration | null>(
    null,
  );
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  // Modal states
  const [battleModalMode, setBattleModalMode] = useState<"create" | "join">(
    "create",
  );
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);

  // Matchmaking hook (for Classic and Control modes)
  const matchmaking = useMatchmaking();

  const canStartSearch = useMemo(() => {
    return (
      selectedMode &&
      selectedSubject &&
      selectedDuration &&
      (selectedMode !== "control" || selectedTier !== null)
    );
  }, [selectedMode, selectedSubject, selectedDuration, selectedTier]);

  const handleStart = async () => {
    if (!canStartSearch) {
      toast.error("Please select all options first!");
      return;
    }

    const config: GameConfiguration = {
      mode: selectedMode!,
      subject: selectedSubject!,
      duration: selectedDuration!,
      selectedTier: selectedMode === "control" ? selectedTier! : undefined,
    };

    if (selectedMode === "battle") {
      setBattleModalMode("create");
      setIsBattleModalOpen(true);
    } else {
      matchmaking.joinQueue(config);
    }
  };

  const handleJoinClick = () => {
    setBattleModalMode("join");
    setIsBattleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4 relative overflow-hidden">
      {/* Background Brain Pattern */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full -ml-48 -mb-48" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Brain className="w-3 h-3" />
            Combat Protocol
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Choose Your <span className="text-blue-500">Battle</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">
            Select your mode and prepare for neural synchronization
          </p>
        </motion.div>

        {/* Mode Grid */}
        <AnimatePresence mode="wait">
          {!selectedMode ? (
            <motion.div
              key="modes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-3 gap-8"
            >
              <ModeCard
                title="Classic"
                description="Face a random opponent from any tier. Pure skill, no boundaries."
                icon={Dices}
                gradient="from-blue-500 to-blue-600"
                features={[
                  "Quick Matchmaking",
                  "Any Tier Opponent",
                  "Standard Points",
                ]}
                selected={false}
                onSelect={() => setSelectedMode("classic")}
                delay={0}
              />

              <ModeCard
                title="Control"
                description="Choose your challenge level. Select which tier to face."
                icon={Target}
                gradient="from-purple-500 to-pink-600"
                features={[
                  "Select Opponent Tier",
                  "Low Risk / High Reward",
                  "Tactical Engagement",
                ]}
                selected={false}
                onSelect={() => setSelectedMode("control")}
                delay={0.1}
              />

              <div className="space-y-4">
                <ModeCard
                  title="Battle"
                  description="Challenge a friend. Create a room and share the code."
                  icon={Swords}
                  gradient="from-orange-500 to-red-600"
                  features={[
                    "Private Combat Rooms",
                    "No Tier Limit",
                    "Internal Leaderboards",
                  ]}
                  selected={false}
                  onSelect={() => setSelectedMode("battle")}
                  delay={0.2}
                />
                <Button
                  onClick={handleJoinClick}
                  variant="ghost"
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-orange-500 hover:bg-orange-500/5 transition-all"
                >
                  Already have a code? Join
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              {/* Configuration Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 md:p-12 shadow-2xl ring-1 ring-slate-200/50 dark:ring-white/5 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <button
                    onClick={() => setSelectedMode(null)}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle with Mode Color */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                    Neural Configuration
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                    {selectedMode === "classic" && (
                      <Dices className="w-8 h-8 text-blue-500" />
                    )}
                    {selectedMode === "control" && (
                      <Target className="w-8 h-8 text-purple-500" />
                    )}
                    {selectedMode === "battle" && (
                      <Swords className="w-8 h-8 text-orange-500" />
                    )}
                    {selectedMode} Protocol
                  </h2>
                </div>

                <SubjectSelector
                  selected={selectedSubject}
                  onSelect={setSelectedSubject}
                />

                <DurationSelector
                  selected={selectedDuration}
                  onSelect={setSelectedDuration}
                />

                {selectedMode === "control" && (
                  <TierSelector
                    selected={selectedTier}
                    onSelect={setSelectedTier}
                  />
                )}

                {/* Action Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleStart}
                    disabled={!canStartSearch}
                    className="w-full h-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black uppercase text-sm tracking-[0.3em] rounded-[24px] shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 disabled:shadow-none"
                  >
                    {selectedMode === "battle"
                      ? "Create War Room"
                      : "Engage Matchmaking"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Matchmaking Screen (for Classic/Control) */}
        <WaitingRoom
          isSearching={matchmaking.isSearching}
          config={{
            mode: selectedMode || "classic",
            subject: selectedSubject || "general_knowledge",
            duration: selectedDuration || 300,
          }}
          timeElapsed={matchmaking.timeElapsed}
          progress={matchmaking.progress}
          onCancel={() => matchmaking.cancelSearch()}
        />

        {/* Private Battle Room Modal */}
        <BattleRoomModal
          isOpen={isBattleModalOpen}
          onClose={() => setIsBattleModalOpen(false)}
          mode={battleModalMode}
          config={
            selectedMode === "battle"
              ? {
                  mode: "battle",
                  subject: selectedSubject!,
                  duration: selectedDuration!,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
