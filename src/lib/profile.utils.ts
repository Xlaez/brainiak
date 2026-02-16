import type { TierInfo } from "@/types/profile.types";

export const TIER_RANGES = {
  10: { min: 0, max: 100 },
  9: { min: 101, max: 200 },
  8: { min: 201, max: 300 },
  7: { min: 301, max: 400 },
  6: { min: 401, max: 500 },
  5: { min: 501, max: 600 },
  4: { min: 601, max: 700 },
  3: { min: 701, max: 800 },
  2: { min: 801, max: 900 },
  1: { min: 901, max: Infinity },
} as const;

export function calculateTier(points: number): number {
  for (const [tier, range] of Object.entries(TIER_RANGES)) {
    if (points >= range.min && points <= range.max) {
      return parseInt(tier);
    }
  }
  return 1;
}

export function getTierInfo(currentPoints: number): TierInfo {
  const currentTier = calculateTier(currentPoints);
  const nextTier = currentTier === 1 ? 1 : currentTier - 1;

  const currentRange = TIER_RANGES[currentTier as keyof typeof TIER_RANGES];
  const nextRange = TIER_RANGES[nextTier as keyof typeof TIER_RANGES];

  const pointsInCurrentTier = currentPoints - currentRange.min;
  const pointsToNextTier = nextRange.min - currentPoints;
  const tierSpan = currentRange.max - currentRange.min + 1;
  const progressPercentage = (pointsInCurrentTier / tierSpan) * 100;

  return {
    currentTier,
    currentPoints,
    nextTier,
    pointsToNextTier: Math.max(0, pointsToNextTier),
    progressPercentage: Math.min(100, progressPercentage),
    tierRange: currentRange,
  };
}

export function getTierColor(tier: number): string {
  const colors: Record<number, string> = {
    1: "from-purple-500 to-pink-500",
    2: "from-yellow-500 to-orange-500",
    3: "from-blue-500 to-cyan-500",
    4: "from-green-500 to-emerald-500",
    5: "from-indigo-500 to-blue-500",
    6: "from-gray-400 to-gray-500",
    7: "from-orange-700 to-orange-800",
    8: "from-slate-500 to-slate-600",
    9: "from-slate-600 to-slate-700",
    10: "from-slate-700 to-slate-800",
  };

  return colors[tier] || colors[10];
}

export function getTierName(tier: number): string {
  const names: Record<number, string> = {
    1: "Legendary",
    2: "Master",
    3: "Diamond",
    4: "Platinum",
    5: "Gold",
    6: "Silver",
    7: "Bronze",
    8: "Iron",
    9: "Stone",
    10: "Beginner",
  };

  return names[tier] || "Beginner";
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function getCountryFlag(country: string): string {
  const countryMap: Record<string, string> = {
    USA: "🇺🇸",
    UK: "🇬🇧",
    Canada: "🇨🇦",
    Nigeria: "🇳🇬",
    Germany: "🇩🇪",
    France: "🇫🇷",
    India: "🇮🇳",
    Japan: "🇯🇵",
    Brazil: "🇧🇷",
    Australia: "🇦🇺",
    Global: "🌐",
  };
  return countryMap[country] || "🌐";
}

export function getSubjectIcon(subject: string): string {
  const icons: Record<string, string> = {
    geography: "🌍",
    politics: "🏛️",
    religion: "✝️",
    philosophy: "🤔",
    science: "🔬",
    technology: "💻",
    programming: "⌨️",
    arts: "🎨",
    music: "🎵",
    maths: "📐",
    general_knowledge: "📚",
  };

  return icons[subject] || "❓";
}

export function getSubjectDisplayName(subject: string): string {
  const names: Record<string, string> = {
    geography: "Geography",
    politics: "Politics",
    religion: "Religion",
    philosophy: "Philosophy",
    science: "Science",
    technology: "Technology",
    programming: "Programming",
    arts: "Arts",
    music: "Music",
    maths: "Mathematics",
    general_knowledge: "General Knowledge",
  };

  return names[subject] || subject;
}
