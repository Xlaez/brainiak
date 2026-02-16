import { create } from "zustand";
import type { UserProfile } from "@/types/profile.types";
import type { Models } from "appwrite";

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Models.User<Models.Preferences> | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, profile: null, isAuthenticated: false }),
}));
