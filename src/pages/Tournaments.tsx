// src/pages/Tournaments.tsx

import { useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useTournaments,
  useUserTournaments,
  useSearchTournaments,
} from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { CreateTournamentModal } from "@/components/tournaments/CreateTournamentModal";

type TabType = "waiting" | "active" | "completed" | "my" | "search";

export default function Tournaments() {
  const [activeTab, setActiveTab] = useState<TabType>("waiting");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Queries
  const { data: tournaments, isLoading: isAllLoading } = useTournaments(
    activeTab === "waiting" ||
      activeTab === "active" ||
      activeTab === "completed"
      ? activeTab
      : undefined,
  );

  const { data: userTournaments, isLoading: isUserLoading } =
    useUserTournaments();
  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchTournaments(searchQuery);

  const isLoading = isAllLoading || isUserLoading || isSearchLoading;

  const getDisplayTournaments = () => {
    if (activeTab === "search") return searchResults || [];
    if (activeTab === "my") return userTournaments || [];
    return tournaments || [];
  };

  const displayTournaments = getDisplayTournaments();

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length >= 2) {
      setActiveTab("search");
    } else if (activeTab === "search") {
      setActiveTab("waiting");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveTab("waiting");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 pb-24 sm:pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-500" />
              Tournaments
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Join a 6-player round-robin battle and prove your expertise.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-2xl shadow-xl shadow-blue-500/20 gap-2 transition-all hover:scale-105 active:scale-95 text-lg"
          >
            <Plus className="w-6 h-6" />
            Launch Tournament
          </Button>
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
          {/* Tabs */}
          <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex w-full md:w-auto">
            {[
              { id: "waiting", label: "Waiting", icon: "🕒" },
              { id: "active", label: "Active", icon: "🔥" },
              { id: "completed", label: "Finished", icon: "🏁" },
              { id: "my", label: "My Entry", icon: "👤" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setSearchQuery("");
                }}
                className={`
                    flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2
                    ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }
                  `}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search tournaments..."
              className="pl-12 h-14 rounded-2xl bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-sm text-lg"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl h-[340px] animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : displayTournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700"
          >
            <div className="text-6xl mb-6">🏝️</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No tournaments found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Be the first to launch one! Set your subjects, duration, and
              invite others to compete.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="rounded-xl border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Start New Tournament
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.$id}
                tournament={tournament}
                delay={index * 0.05}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
