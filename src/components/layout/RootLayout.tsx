import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { authService } from "@/services/auth.service";
import { Toaster } from "sonner";
import { Header } from "./Header";

export function RootLayout() {
  const { setUser, setProfile, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (user) {
        setUser(user);
        const profile = await authService.getUserProfile(user.$id);
        if (profile) {
          setProfile(profile);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [setUser, setProfile, setLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-blue-500"></div>
          <p className="font-semibold text-slate-600 dark:text-slate-400">
            Loading Brainiak...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <main className="container py-8">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
