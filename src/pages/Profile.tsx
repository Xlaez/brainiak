import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { TierProgress } from "@/components/profile/TierProgress";
import { RecentMatches } from "@/components/profile/RecentMatches";
import { SubjectBreakdown } from "@/components/profile/SubjectBreakdown";
import { PerformanceChart } from "@/components/profile/PerformanceChart";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import {
  useProfile,
  useRecentMatches,
  useSubjectPerformance,
} from "@/hooks/useProfile";
import { useAuthStore } from "@/stores/authStore";

export default function Profile() {
  const { userId } = useParams({ strict: false }) as { userId?: string };
  const { user: currentUser } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const profileUserId = userId || currentUser?.$id || "";
  const isOwnProfile = profileUserId === currentUser?.$id;

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile(profileUserId);

  const { data: recentMatches, isLoading: matchesLoading } = useRecentMatches(
    profileUserId,
    10,
  );

  const { data: subjectPerformance, isLoading: subjectLoading } =
    useSubjectPerformance(profileUserId);

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center text-slate-500">
          <div className="text-6xl mb-6">🏜️</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            Profile Lost in Space
          </h2>
          <p className="text-sm font-semibold uppercase tracking-widest opacity-60">
            The user you're seeking does not exist
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-16 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-hidden">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setIsEditModalOpen(true)}
        />
      </div>

      <ProfileStats
        stats={{
          totalPoints: profile.totalPoints,
          gamesPlayed: profile.gamesPlayed,
          gamesWon: profile.gamesWon,
          winRate: profile.winRate,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <TierProgress profile={profile} />
          <PerformanceChart matches={recentMatches || []} />
        </div>
        <div className="lg:col-span-2">
          <SubjectBreakdown
            performance={subjectPerformance || []}
            isLoading={subjectLoading}
          />
        </div>
      </div>

      <RecentMatches matches={recentMatches || []} isLoading={matchesLoading} />

      {isOwnProfile && (
        <EditProfileModal
          profile={profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
