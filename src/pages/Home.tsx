import { Link } from "@tanstack/react-router";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-5xl font-bold text-blue-500 mb-6">Brainiak</h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg text-center">
        The ultimate real-time multiplayer brain quiz game. Master subjects,
        climb tiers, and dominate the leaderboard.
      </p>
      <div className="flex gap-4">
        <Link to="/play">
          <button className="button-primary-macos">Play Now</button>
        </Link>
        <button className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          Learn More
        </button>
      </div>
    </div>
  );
}
