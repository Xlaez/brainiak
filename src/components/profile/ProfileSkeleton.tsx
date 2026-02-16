export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="bg-white dark:bg-slate-800 rounded-2xl h-[350px] mb-6 shadow-sm overflow-hidden">
        <div className="h-[200px] bg-slate-200 dark:bg-slate-700" />
        <div className="px-6 pb-6 mt-[-64px]">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700" />
          <div className="mt-4 space-y-3">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
          />
        ))}
      </div>

      <div className="h-48 bg-white dark:bg-slate-800 rounded-xl mb-6 shadow-sm border border-slate-100 dark:border-slate-700" />
      <div className="h-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700" />
    </div>
  );
}
