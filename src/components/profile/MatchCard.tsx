import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { RecentMatch } from "@/types/profile.types";
import {
  getTierColor,
  getSubjectIcon,
  getSubjectDisplayName,
} from "@/lib/profile.utils";
import { ProfileService } from "@/services/profile.service";

interface MatchCardProps {
  match: RecentMatch;
  delay?: number;
}

export function MatchCard({ match, delay = 0 }: MatchCardProps) {
  const resultConfigs = {
    won: {
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    lost: {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: <TrendingDown className="w-3.5 h-3.5" />,
    },
    draw: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      icon: <Minus className="w-3.5 h-3.5" />,
    },
  };

  const config = resultConfigs[match.result];

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0">
            {match.opponent_profile_image ? (
              <img
                src={ProfileService.getImageUrl(match.opponent_profile_image)}
                alt={match.opponentUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                {match.opponentUsername.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate uppercase tracking-tight">
                {match.opponentUsername}
              </span>

              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r ${getTierColor(match.opponentTier)}`}
              >
                T{match.opponentTier}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>
                {getSubjectIcon(match.subject)}{" "}
                {getSubjectDisplayName(match.subject)}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>{match.gameType}</span>
            </div>
          </div>
        </div>

        <div className="text-center px-4 border-x border-slate-200/50 dark:border-slate-700/50">
          <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
            {match.userScore} : {match.opponentScore}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 w-24">
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${config.bg} ${config.text}`}
          >
            {config.icon}
            {match.result}
          </div>

          <div
            className={`text-xs font-black tabular-nums ${match.pointsChanged >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {match.pointsChanged > 0 ? "+" : ""}
            {match.pointsChanged} PTS
          </div>
        </div>
      </div>
    </motion.div>
  );
}
