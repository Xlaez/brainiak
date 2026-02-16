import { motion } from "framer-motion";
import { Edit2, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/profile.types";
import { getTierColor, getTierName, getCountryFlag } from "@/lib/profile.utils";
import { ProfileService } from "@/services/profile.service";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEditClick?: () => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  onEditClick,
}: ProfileHeaderProps) {
  const defaultGradient =
    "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700";

  const memberSince = new Date(profile.$createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative">
      <div className="relative h-[200px] overflow-hidden">
        {profile.cover_image ? (
          <img
            src={ProfileService.getImageUrl(profile.cover_image)}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${defaultGradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
      </div>

      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="-mt-16"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-700">
                {profile.profile_image ? (
                  <img
                    src={ProfileService.getImageUrl(profile.profile_image)}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div
                className={`absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg bg-gradient-to-r ${getTierColor(profile.tier)}`}
              >
                T{profile.tier}
              </div>
            </div>
          </motion.div>

          {isOwnProfile && (
            <Button
              onClick={onEditClick}
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg h-9"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {profile.username}
            </h1>

            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getTierColor(profile.tier)}`}
            >
              {getTierName(profile.tier)}
            </span>

            <span className="text-xl" title={profile.country}>
              {getCountryFlag(profile.country)}
            </span>
          </div>

          {profile.bio && (
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.country}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {memberSince}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
