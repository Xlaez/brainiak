// src/pages/Leaderboard.tsx

import { useState, useMemo } from "react";
import { Search, Filter, X, Trophy, Target, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Podium } from "@/components/leaderboard/Podium";
import { PlayerRow } from "@/components/leaderboard/PlayerRow";
import { UserRankCard } from "@/components/leaderboard/UserRankCard";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";
import {
  useLeaderboard,
  useUserRank,
  useTop3Players,
} from "@/hooks/useLeaderboard";
import { useAuthStore } from "@/stores/authStore";
import type {
  LeaderboardType,
  LeaderboardFilters,
} from "@/types/leaderboard.types";

export default function Leaderboard() {
  const profile = useAuthStore((state) => state.profile);

  const [leaderboardType, setLeaderboardType] =
    useState<LeaderboardType>("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | undefined>(
    undefined,
  );

  const filters: LeaderboardFilters = useMemo(
    () => ({
      search: searchQuery || undefined,
      tier: selectedTier,
    }),
    [searchQuery, selectedTier],
  );

  const { data: players, isLoading } = useLeaderboard(
    leaderboardType,
    profile?.country,
    filters,
  );

  const { data: top3 } = useTop3Players(leaderboardType, profile?.country);

  const { data: userRank } = useUserRank(
    leaderboardType,
    profile?.userId || "",
    profile?.country,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTier(undefined);
  };

  const hasFilters = !!(searchQuery || selectedTier);

  // Check if user is in visible top 100
  const userInTop100 = players?.some((p) => p.userId === profile?.userId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 sm:py-12 px-4 pb-24 sm:pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-4xl sm:text-5xl">🏆</span>
            Leaderboard
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400">
            Compete with the best brains around the world
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl inline-flex w-full sm:w-auto">
            <button
              onClick={() => setLeaderboardType("global")}
              className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                leaderboardType === "global"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🌍 Global
            </button>

            <button
              onClick={() => setLeaderboardType("regional")}
              className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                leaderboardType === "regional"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📍 Regional
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="pl-10 h-11 sm:h-12 rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-2">
              {/* Tier Filter */}
              <Select
                value={selectedTier?.toString() || "all"}
                onValueChange={(value) =>
                  setSelectedTier(value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger className="flex-1 sm:w-40 h-11 sm:h-12 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" />
                    <SelectValue placeholder="All Tiers" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tier) => (
                    <SelectItem key={tier} value={tier.toString()}>
                      Tier {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reset */}
              {hasFilters && (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="h-11 sm:h-12 rounded-xl px-3 sm:px-4"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Reset</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Podium (Top 3) */}
        {!hasFilters &&
          top3 &&
          top3.length > 0 &&
          leaderboardType === "global" && <Podium players={top3} />}

        {/* Leaderboard List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 mb-6">
          {/* List Header */}
          <div className="hidden sm:flex items-center gap-4 px-4 pb-4 border-b border-slate-100 dark:border-slate-700 mb-4 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="w-12 text-center">Rank</div>
            <div className="w-12 text-center">Player</div>
            <div className="flex-1 ml-4">Username</div>
            <div className="flex items-center gap-6 pr-6">
              <div className="w-24 text-center flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" /> Points
              </div>
              <div className="w-20 text-center flex items-center justify-center gap-1">
                <Target className="w-3 h-3" /> Games
              </div>
              <div className="hidden md:flex w-24 text-center items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> W/R
              </div>
            </div>
          </div>

          {isLoading ? (
            <LeaderboardSkeleton />
          ) : !players || players.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl sm:text-6xl mb-4">🔍</div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No players found matching your criteria
              </p>
              <Button
                variant="link"
                onClick={handleResetFilters}
                className="mt-2 text-blue-500"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {players.map((player, index) => (
                <PlayerRow
                  key={player.userId}
                  player={player}
                  isCurrentUser={player.userId === profile?.userId}
                  delay={Math.min(index * 0.02, 0.5)}
                />
              ))}
            </div>
          )}
        </div>

        {/* User Rank Card */}
        {userRank && profile && !userInTop100 && (
          <div className="mt-8">
            <UserRankCard
              rankInfo={userRank}
              userPoints={profile.totalPoints || 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
