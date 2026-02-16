export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4 flex items-center gap-4 min-h-[80px]"
        >
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg" />
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3" />
          </div>
          <div className="flex gap-6">
            <div className="hidden sm:block w-16 h-8 bg-slate-200 dark:bg-slate-600 rounded" />
            <div className="hidden sm:block w-16 h-8 bg-slate-200 dark:bg-slate-600 rounded" />
            <div className="hidden md:block w-16 h-8 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
