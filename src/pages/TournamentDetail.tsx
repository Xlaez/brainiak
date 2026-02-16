// src/pages/TournamentDetail.tsx

import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentLobby } from "@/components/tournaments/TournamentLobby";
import { TournamentStandings } from "@/components/tournaments/TournamentStandings";
import { TournamentChat } from "@/components/tournaments/TournamentChat";
import { WinnerModal } from "@/components/tournaments/WinnerModal";
import { useTournament } from "@/hooks/useTournaments";
import { useState, useEffect } from "react";

export default function TournamentDetail() {
  const { tournamentId } = useParams({ from: "/tournaments/$tournamentId" });
  const navigate = useNavigate();

  const { data: tournament, isLoading, refetch } = useTournament(tournamentId);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Show winner modal when tournament completes
  useEffect(() => {
    if (tournament?.status === "completed" && !showWinnerModal) {
      setShowWinnerModal(true);
    }
  }, [tournament?.status, showWinnerModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading tournament...
          </p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Tournament Not Found
          </h2>
          <Button
            onClick={() => navigate({ to: "/tournaments" })}
            className="mt-4"
          >
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => navigate({ to: "/tournaments" })}
          variant="ghost"
          className="mb-6 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tournaments
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <TournamentLobby tournament={tournament} onRefresh={refetch} />

            {tournament.status !== "waiting" && (
              <TournamentStandings tournament={tournament} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TournamentChat tournament={tournament} onRefresh={refetch} />
          </div>
        </div>
      </div>

      {tournament?.status === "completed" && (
        <WinnerModal
          tournament={tournament}
          isOpen={showWinnerModal}
          onClose={() => setShowWinnerModal(false)}
        />
      )}
    </div>
  );
}
