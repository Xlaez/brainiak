import type { Models } from "appwrite";

export type GameMode = "classic" | "control" | "battle";

export type Subject =
  | "geography"
  | "politics"
  | "religion"
  | "philosophy"
  | "science"
  | "technology"
  | "programming"
  | "arts"
  | "music"
  | "maths"
  | "general_knowledge";

export type Duration = 300 | 600 | 1200; // 5, 10, 20 minutes in seconds

export interface GameConfiguration {
  mode: GameMode;
  subject: Subject;
  duration: Duration;
  selectedTier?: number; // For control mode
  inviteCode?: string; // For battle mode
}

export interface QueueEntry extends Models.Document {
  $id: string;
  queueId: string;
  userId: string;
  username: string;
  tier: number;
  gameType: GameMode;
  selectedTier?: number;
  subject: Subject;
  duration: Duration;
  joinedAt: string;
  status: "waiting" | "matched" | "cancelled" | "expired";
  matchedWith?: string; // opponent userId when matched
}

export interface BattleRoom extends Models.Document {
  $id: string;
  roomId: string; // The specific ID used in collections
  inviteCode: string;
  hostId: string;
  hostUsername: string;
  hostTier: number;
  opponentId?: string | null;
  opponentUsername?: string | null;
  opponentTier?: number | null;
  subject: Subject;
  duration: Duration;
  status: "waiting" | "ready" | "starting" | "active" | "cancelled";
  hostReady: boolean;
  opponentReady: boolean;
  gameRoomId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchmakingState {
  isSearching: boolean;
  queueId?: string;
  timeElapsed: number; // seconds
  config: GameConfiguration | null;
}

export const SUBJECTS: Array<{
  id: Subject;
  name: string;
  icon: string;
  color: string;
}> = [
  {
    id: "geography",
    name: "Geography",
    icon: "🌍",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "politics",
    name: "Politics",
    icon: "🏛️",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "religion",
    name: "Religion",
    icon: "✝️",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "philosophy",
    name: "Philosophy",
    icon: "🤔",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "science",
    name: "Science",
    icon: "🔬",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "technology",
    name: "Technology",
    icon: "💻",
    color: "from-slate-500 to-gray-500",
  },
  {
    id: "programming",
    name: "Programming",
    icon: "⌨️",
    color: "from-green-500 to-teal-500",
  },
  {
    id: "arts",
    name: "Arts",
    icon: "🎨",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "music",
    name: "Music",
    icon: "🎵",
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "maths",
    name: "Mathematics",
    icon: "📐",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "general_knowledge",
    name: "General",
    icon: "📚",
    color: "from-amber-500 to-yellow-500",
  },
];

export const DURATIONS = [
  { value: 300, label: "5 Minutes", icon: "⚡" },
  { value: 600, label: "10 Minutes", icon: "⏱️" },
  { value: 1200, label: "20 Minutes", icon: "⏳" },
];
