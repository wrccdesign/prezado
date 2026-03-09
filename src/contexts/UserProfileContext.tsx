import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type UserProfile = "cidadao" | "advogado";

interface UserProfileContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  isLawyer: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const STORAGE_KEY = "jurisai-user-profile";

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "advogado" ? "advogado" : "cidadao";
    } catch {
      return "cidadao";
    }
  });

  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {}
  };

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, isLawyer: profile === "advogado" }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
