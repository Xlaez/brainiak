import { useParams, useNavigate } from "@tanstack/react-router";
import { useTournament } from "@/hooks/useTournaments";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TournamentDetail() {
  const { tournamentId } = useParams({ from: "/tournaments/$tournamentId" });
  const navigate = useNavigate();
  const { data: tournament, isLoading, error } = useTournament(tournamentId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Tournament not found</h1>
        <Button onClick={() => navigate({ to: "/tournaments" })}>
          Back to Tournaments
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/tournaments" })}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listing
        </Button>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">{tournament.name}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            This is Part 1. Tournament details and lobby logic will be
            implemented in Part 2.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <span className="text-xs text-slate-500 uppercase font-bold">
                Status
              </span>
              <p className="font-bold text-lg uppercase">{tournament.status}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <span className="text-xs text-slate-500 uppercase font-bold">
                Players
              </span>
              <p className="font-bold text-lg">
                {tournament.participants.length}/6
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
