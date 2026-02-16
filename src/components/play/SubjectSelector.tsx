import { motion } from "framer-motion";
import type { Subject } from "@/types/play.types";
import { SUBJECTS } from "@/types/play.types";

interface SubjectSelectorProps {
  selected: Subject | null;
  onSelect: (subject: Subject) => void;
}

export function SubjectSelector({ selected, onSelect }: SubjectSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        Choose Subject
      </label>

      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((subject, index) => (
          <motion.button
            key={subject.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(subject.id)}
            className={`
              px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-tight
              transition-all duration-200 flex items-center gap-2
              ${
                selected === subject.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300 dark:ring-blue-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }
            `}
          >
            <span className="text-base">{subject.icon}</span>
            {subject.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
