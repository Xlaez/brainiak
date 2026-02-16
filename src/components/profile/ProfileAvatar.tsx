import { useState } from "react";
import { ProfileService } from "@/services/profile.service";
import { getTierColor } from "@/lib/profile.utils";

interface ProfileAvatarProps {
  username?: string;
  avatarUrl?: string; // Can be fileId or full URL
  tier?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: React.CSSProperties;
  showTierBadge?: boolean;
}

export function ProfileAvatar({
  username = "User",
  avatarUrl,
  tier = 10,
  size = "md",
  className = "",
  style,
  showTierBadge = false,
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-[8px]",
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-32 h-32 text-4xl",
  };

  const badgeSizeClasses = {
    xs: "bottom-0 right-0 px-1 py-0 text-[6px]",
    sm: "bottom-0 right-0 px-1 py-0.5 text-[7px]",
    md: "bottom-0.5 right-0.5 px-2 py-0.5 text-[8px]",
    lg: "bottom-1 right-1 px-2.5 py-0.5 text-[10px]",
    xl: "bottom-2 right-2 px-3 py-1 text-[12px]",
  };

  const imageUrl = avatarUrl ? ProfileService.getImageUrl(avatarUrl) : null;

  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 ring-2 ring-white dark:ring-slate-900 shadow-sm`}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={username}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">
            {username.charAt(0)}
          </span>
        )}
      </div>

      {showTierBadge && (
        <div
          className={`absolute ${badgeSizeClasses[size]} rounded-full font-black text-white shadow-lg bg-gradient-to-r ${getTierColor(tier)} ring-1 ring-white dark:ring-slate-900`}
        >
          {tier}
        </div>
      )}
    </div>
  );
}
