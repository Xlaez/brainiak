// src/components/tournaments/TournamentChat.tsx

import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tournament } from "@/types/tournament.types";

interface TournamentChatProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function TournamentChat({ tournament }: TournamentChatProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30 flex flex-col h-[600px]">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-500" />
        Tournament Chat
      </h3>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {tournament.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          tournament.chatMessages.map((msg, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {msg.username}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-slate-700 dark:text-slate-300 ring-1 ring-slate-100 dark:ring-slate-800">
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus-visible:ring-blue-500"
        />
        <Button
          size="icon"
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
