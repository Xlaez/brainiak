import { motion } from "framer-motion";
import { TrendingUp, Target, Trophy, Award } from "lucide-react";
import type { ProfileStats as Stats } from "@/types/profile.types";
import { formatNumber, formatPercentage } from "@/lib/profile.utils";

interface ProfileStatsProps {
  stats: Stats;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  delay: number;
}

function StatCard({ icon, label, value, subtitle, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
        {icon}
        <span>{label}</span>
      </div>

      <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
        {value}
      </div>

      {subtitle && (
        <div className="text-[10px] font-medium text-slate-400 uppercase mt-1">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Trophy className="w-3.5 h-3.5" />}
        label="Points"
        value={formatNumber(stats.totalPoints)}
        delay={0}
      />

      <StatCard
        icon={<Target className="w-3.5 h-3.5" />}
        label="Played"
        value={formatNumber(stats.gamesPlayed)}
        delay={0.1}
      />

      <StatCard
        icon={<Award className="w-3.5 h-3.5" />}
        label="Wins"
        value={formatNumber(stats.gamesWon)}
        subtitle={`${stats.gamesPlayed - stats.gamesWon} losses`}
        delay={0.2}
      />

      <StatCard
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        label="Win Rate"
        value={formatPercentage(stats.winRate)}
        delay={0.3}
      />
    </div>
  );
}
