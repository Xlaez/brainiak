import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface AnswerButtonProps {
  letter: "A" | "B" | "C" | "D";
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  disabled: boolean;
  onClick: () => void;
  delay?: number;
}

export function AnswerButton({
  letter,
  text,
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  onClick,
  delay = 0,
}: AnswerButtonProps) {
  const getButtonStyles = () => {
    if (isCorrect) {
      return "bg-green-500 text-white ring-2 ring-green-400 shadow-lg shadow-green-500/25";
    }
    if (isWrong) {
      return "bg-red-500 text-white ring-2 ring-red-400 shadow-lg shadow-red-500/25";
    }
    if (isSelected) {
      return "bg-blue-600 text-white ring-2 ring-blue-400 shadow-md shadow-blue-500/25";
    }
    return "bg-white dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-sm";
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-5 rounded-2xl font-semibold text-lg text-left
        transition-all duration-200 flex items-center gap-4
        ${getButtonStyles()}
        ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Letter Badge */}
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-lg
          ${
            isCorrect || isWrong || isSelected
              ? "bg-white/20"
              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }
        `}
      >
        {letter}
      </div>

      {/* Answer Text */}
      <span className="flex-1 leading-tight">{text}</span>

      {/* Status Icon */}
      <AnimatePresence>
        {isCorrect && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Check className="w-6 h-6 stroke-[3px]" />
          </motion.div>
        )}

        {isWrong && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, x: [0, -4, 4, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
          >
            <X className="w-6 h-6 stroke-[3px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
