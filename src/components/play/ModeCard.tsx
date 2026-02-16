import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
  delay?: number;
}

export function ModeCard({
  title,
  description,
  icon: Icon,
  gradient,
  features,
  selected,
  onSelect,
  delay = 0,
}: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer h-full"
      onClick={onSelect}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 h-full flex flex-col transition-all duration-300 ${
          selected
            ? "ring-blue-500 ring-2 shadow-blue-500/10"
            : "ring-slate-200/30 dark:ring-slate-700/30 hover:ring-slate-300 dark:hover:ring-slate-600"
        }`}
      >
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-6 flex-1 text-sm font-medium leading-relaxed">
          {description}
        </p>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              <div
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient} shadow-sm`}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Select Button */}
        <Button
          className={`w-full h-12 bg-gradient-to-r ${gradient} hover:brightness-110 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-none`}
        >
          {selected ? "Selected" : `Select ${title}`}
        </Button>
      </div>
    </motion.div>
  );
}
