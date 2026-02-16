export interface UserProfile {
  $id: string;
  userId: string;
  username: string;
  country: string;
  tier: number;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  createdAt: string;
  updatedAt: string;
}

export type UserTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const TIER_RANGES = {
  10: { min: 0, max: 100 },
  9: { min: 101, max: 200 },
  8: { min: 201, max: 300 },
  7: { min: 301, max: 400 },
  6: { min: 401, max: 500 },
  5: { min: 501, max: 600 },
  4: { min: 601, max: 701 },
  3: { min: 701, max: 800 },
  2: { min: 801, max: 900 },
  1: { min: 901, max: Infinity },
} as const;
