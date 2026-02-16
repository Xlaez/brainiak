import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, User, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types/profile.types";
import { useUpdateProfile } from "@/hooks/useProfile";
import { ProfileService } from "@/services/profile.service";
import { toast } from "sonner";

interface EditProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({
  profile,
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || "");
  const [profileImage, setProfileImage] = useState<string | undefined>(
    ProfileService.getImageUrl(profile.profile_image),
  );
  const [coverImage, setCoverImage] = useState<string | undefined>(
    ProfileService.getImageUrl(profile.cover_image),
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateProfile();

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const previewUrl = URL.createObjectURL(file);
    if (type === "profile") {
      setProfileImage(previewUrl);
      setProfileFile(file);
    } else {
      setCoverImage(previewUrl);
      setCoverFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let finalProfileImage = profile.profile_image;
      let finalCoverImage = profile.cover_image;

      // 1. Upload files if they changed
      if (profileFile) {
        const uploaded = await ProfileService.uploadFile(profileFile);
        finalProfileImage = uploaded.$id;
      }

      if (coverFile) {
        const uploaded = await ProfileService.uploadFile(coverFile);
        finalCoverImage = uploaded.$id;
      }

      // 2. Update profile document
      await updateProfile.mutateAsync({
        userId: profile.userId,
        data: {
          username,
          bio,
          profile_image: finalProfileImage,
          cover_image: finalCoverImage,
        },
      });

      toast.success("Profile updated perfectly!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden pointer-events-auto ring-1 ring-slate-200 dark:ring-slate-700"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  Edit Profile
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cover Image
                  </Label>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="relative h-32 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer group border-2 border-dashed border-slate-200 dark:border-slate-700"
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-bold">
                          CLICK TO UPLOAD
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "cover")}
                    className="hidden"
                  />
                </div>

                {/* Profile Image Upload */}
                <div className="flex justify-center -mt-12 relative z-10">
                  <div className="relative group">
                    <div
                      onClick={() => profileInputRef.current?.click()}
                      className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-xl cursor-pointer"
                    >
                      <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden relative">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "profile")}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-slate-50 dark:bg-slate-900/50 border-none h-12 text-sm font-bold focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="bio"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your story..."
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl p-4 text-sm font-bold resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
