import { useState, useEffect } from "react";

interface Profile {
  name: string;
  avatarUrl: string | null;
}

const PROFILE_STORAGE_KEY = "mayotti_profile";

const defaultProfile: Profile = {
  name: "User",
  avatarUrl: null,
};

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fall back to default on corrupted data
    }
    return defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateName = (name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  };

  const updateAvatar = (avatarUrl: string | null) => {
    setProfile((prev) => ({ ...prev, avatarUrl }));
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  return {
    profile,
    updateName,
    updateAvatar,
    resetProfile,
  };
};
