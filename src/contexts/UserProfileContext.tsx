import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type ProfileType = "cidadao" | "advogado";

export interface ProfileData {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  oab_number: string | null;
  oab_state: string | null;
  specialties: string[];
  office_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfileContextType {
  profile: ProfileType;
  profileData: ProfileData | null;
  isLawyer: boolean;
  loading: boolean;
  updateProfile: (data: Partial<Omit<ProfileData, "id" | "user_id" | "created_at" | "updated_at">>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfileData(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      if (data) {
        setProfileData({
          ...data,
          profile_type: data.profile_type as ProfileType,
          specialties: data.specialties || [],
        });
      } else {
        // Profile doesn't exist yet (shouldn't happen with trigger, but fallback)
        setProfileData(null);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<Omit<ProfileData, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw error;

    await fetchProfile();
  };

  const profile = profileData?.profile_type ?? "cidadao";
  const isLawyer = profile === "advogado";

  return (
    <UserProfileContext.Provider value={{ 
      profile, 
      profileData, 
      isLawyer, 
      loading, 
      updateProfile,
      refreshProfile: fetchProfile 
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
