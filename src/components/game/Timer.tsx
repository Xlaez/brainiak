// src/components/game/Timer.tsx

import React from "react";
import { motion } from "framer-motion";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export function Timer({ timeRemaining, totalTime }: TimerProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const circumference = 2 * Math.PI * 36; // radius = 36
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on time remaining
  let strokeColor = "#3B82F6"; // blue
  if (timeRemaining <= 3) {
    strokeColor = "#EF4444"; // red
  } else if (timeRemaining <= 5) {
    strokeColor = "#F59E0B"; // yellow
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Background Circle */}
        <svg width="84" height="84" className="transform -rotate-90">
          <circle
            cx="42"
            cy="42"
            r="36"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Progress Circle */}
          <motion.circle
            cx="42"
            cy="42"
            r="36"
            stroke={strokeColor}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>

        {/* Time Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={timeRemaining}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`text-2xl font-black tabular-nums ${
              timeRemaining <= 3
                ? "text-red-500"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {Math.max(0, timeRemaining)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
