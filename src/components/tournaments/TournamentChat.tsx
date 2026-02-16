import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Tournament,
  TournamentChatMessage,
} from "@/types/tournament.types";
import { useAuthStore } from "@/stores/authStore";
import { TournamentService } from "@/services/tournament.service";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { toast } from "sonner";

interface TournamentChatProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function TournamentChat({ tournament, onRefresh }: TournamentChatProps) {
  const profile = useAuthStore((state) => state.profile);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messages = TournamentService.getChatMessages(tournament);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!profile || !message.trim() || isSending) return;

    // Rate limiting (2 seconds)
    const now = Date.now();
    if (now - lastSentTime < 2000) {
      toast.error("Please wait before sending another message");
      return;
    }

    setIsSending(true);

    try {
      await TournamentService.sendChatMessage(
        tournament.$id,
        profile.userId,
        profile.username,
        message,
        profile.profile_image,
      );

      setMessage("");
      setLastSentTime(now);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-xl ring-1 ring-slate-200/30 dark:ring-slate-700/30 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Tournament Chat
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.messageId || index}
                message={msg}
                isOwnMessage={msg.userId === profile?.userId}
                tournament={tournament}
              />
            ))}
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={500}
            disabled={isSending}
            className="flex-1 rounded-xl"
          />

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 text-white rounded-xl px-4"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        <div className="text-[10px] text-slate-400 mt-2 text-right uppercase font-bold tracking-widest">
          {message.length}/500
        </div>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: TournamentChatMessage;
  isOwnMessage: boolean;
  tournament: Tournament;
}

function ChatMessage({ message, isOwnMessage, tournament }: ChatMessageProps) {
  const participant = tournament.participants.find(
    (p) => p.userId === message.userId,
  );

  const isCreator = tournament.creatorId === message.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <ProfileAvatar
          username={message.username}
          avatarUrl={message.avatarUrl}
          tier={participant?.tier || 10}
          size="sm"
        />
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
        <div
          className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : ""}`}
        >
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {message.username}
          </span>

          {isCreator && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white uppercase tracking-tighter">
              HOST
            </span>
          )}

          <span className="text-[10px] text-slate-400 font-medium">
            {new Date(message.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div
          className={`inline-block px-4 py-2 rounded-2xl max-w-md ${
            isOwnMessage
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
