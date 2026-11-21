import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { takeSignupOrigem, trackOnce } from "@/lib/track";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { setPendingRedirect } from "@/lib/authRedirect";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, profileData?: LawyerSignUpData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null; redirected?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}


interface LawyerSignUpData {
  profile_type: "advogado";
  oab_number: string;
  oab_state: string;
  specialties: string[];
  office_name: string | null;
}

/** sign_up: primeira sessão de uma conta criada há poucos minutos (e-mail confirmado ou Google). */
function trackSignUpIfNew(u: User | null | undefined) {
  if (!u?.created_at) return;
  if (Date.now() - new Date(u.created_at).getTime() > 30 * 60 * 1000) return;
  const { origem, calculadora } = takeSignupOrigem();
  trackOnce(`signup_${u.id}`, "sign_up", {
    method: (u.app_metadata?.provider as string) || "email",
    origem,
    calculadora,
  });
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") trackSignUpIfNew(session?.user);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    void supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, profileData?: LawyerSignUpData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: profileData,
        },
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      return { error: error as Error | null };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      if (redirectTo) setPendingRedirect(redirectTo);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) return { error: toAuthError(result.error) };
      return { error: null, redirected: Boolean(result.redirected) };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const resetPassword = async (email: string) => {


    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function toAuthError(error: unknown): Error {
  if (error instanceof Error && error.message === "Invalid login credentials") {
    return new Error("E-mail ou senha incorretos.");
  }
  if (error instanceof Error && error.message !== "Failed to fetch") return error;
  return new Error("Não foi possível conectar ao serviço de autenticação. Aguarde alguns instantes e tente novamente.");
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
