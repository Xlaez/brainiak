// src/components/game/QuestionCard.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnswerButton } from "./AnswerButton";
import type { Question } from "@/types/game.types";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: "A" | "B" | "C" | "D" | null;
  hasSubmitted: boolean;
  onSelectAnswer: (answer: "A" | "B" | "C" | "D") => void;
  showCorrectAnswer: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  userAnswer,
  hasSubmitted,
  onSelectAnswer,
  showCorrectAnswer,
}: QuestionCardProps) {
  const options: Array<{ letter: "A" | "B" | "C" | "D"; text: string }> = [
    { letter: "A", text: question.optionA },
    { letter: "B", text: question.optionB },
    { letter: "C", text: question.optionC },
    { letter: "D", text: question.optionD },
  ];

  return (
    <motion.div
      key={question.$id}
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-700/50"
    >
      {/* Question Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-widest">
            Level {question.difficulty}
          </span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700/50" />
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Q{questionNumber} / {totalQuestions}
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-[1.2]"
        >
          {question.questionText}
        </motion.h2>
      </div>

      {/* Answer Options */}
      <div className="grid gap-4">
        {options.map((option, index) => (
          <AnswerButton
            key={option.letter}
            letter={option.letter}
            text={option.text}
            isSelected={userAnswer === option.letter}
            isCorrect={
              showCorrectAnswer && question.correctAnswer === option.letter
            }
            isWrong={
              showCorrectAnswer &&
              userAnswer === option.letter &&
              question.correctAnswer !== option.letter
            }
            disabled={hasSubmitted}
            onClick={() => onSelectAnswer(option.letter)}
            delay={0.3 + index * 0.08}
          />
        ))}
      </div>
    </motion.div>
  );
}
