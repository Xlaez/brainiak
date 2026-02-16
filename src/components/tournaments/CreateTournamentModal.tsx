import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTournament } from "@/hooks/useTournaments";
import { getSubjectDisplayName, getSubjectIcon } from "@/lib/profile.utils";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBJECTS = [
  "geography",
  "politics",
  "religion",
  "philosophy",
  "science",
  "technology",
  "programming",
  "arts",
  "music",
  "maths",
  "general_knowledge",
];

export function CreateTournamentModal({
  isOpen,
  onClose,
}: CreateTournamentModalProps) {
  const [name, setName] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState("600"); // Default 10 mins

  const createTournament = useCreateTournament();

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== subject));
    } else if (selectedSubjects.length < 3) {
      setSelectedSubjects((prev) => [...prev, subject]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (name.length < 3) return;
    if (selectedSubjects.length === 0) return;

    try {
      await createTournament.mutateAsync({
        name,
        subjects: selectedSubjects,
        duration: parseInt(duration),
      });
      onClose();
      // Reset form
      setName("");
      setSelectedSubjects([]);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create Tournament
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Invite players for a round-robin showdown
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="tournament-name"
                  className="text-sm font-semibold"
                >
                  Tournament Name
                </Label>
                <Input
                  id="tournament-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weekend Brainiacs #1"
                  required
                  className="rounded-xl h-11"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Game Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">5 Minutes</SelectItem>
                    <SelectItem value="600">10 Minutes</SelectItem>
                    <SelectItem value="1200">20 Minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration per match
                </p>
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">
                    Select Subjects (1-3)
                  </Label>
                  <span className="text-xs text-slate-500">
                    {selectedSubjects.length}/3 selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleToggleSubject(subject)}
                      className={`
                        flex items-center gap-2 p-2 rounded-xl text-left border transition-all
                        ${
                          selectedSubjects.includes(subject)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
                        }
                      `}
                    >
                      <span className="text-lg">{getSubjectIcon(subject)}</span>
                      <span className="text-xs font-medium truncate">
                        {getSubjectDisplayName(subject)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex gap-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <p>
                  A round-robin tournament requires 6 players. Once full, 15
                  matches will be generated automatically.
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={
                  createTournament.isPending ||
                  selectedSubjects.length === 0 ||
                  name.length < 3
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/20"
              >
                {createTournament.isPending
                  ? "Creating..."
                  : "Launch Tournament"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
