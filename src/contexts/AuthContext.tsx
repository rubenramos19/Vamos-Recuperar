import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { User, Session } from "@supabase/supabase-js";

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

type AppRole = "reporter" | "admin";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: AppRole;
  emailVerified: boolean;
} | null;

interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const { toast } = useToast();

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity));
    };
  }, [user, updateActivity]);

  // Check for session timeout
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        try {
          await supabase.auth.signOut();
          toast({
            title: "Session expired",
            description: "You've been logged out due to inactivity",
            variant: "destructive",
          });
        } catch (error) {
          logger.error("Logout error:", error);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, lastActivity, toast]);

  /**
   * Ensures profile exists and ensures role exists (without UPSERT on user_roles).
   * This avoids RLS issues where upsert can require UPDATE permission.
   */
  const fetchUserData = async (supabaseUser: User) => {
    try {
      const fallbackName =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        "";

      // 1) Ensure profile exists (upsert is ok here)
      const { data: profile, error: profileUpsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: supabaseUser.id,
            email: supabaseUser.email || "",
            name: fallbackName,
          },
          { onConflict: "user_id" }
        )
        .select("*")
        .single();

      if (profileUpsertError) {
        logger.error("Profile upsert error:", profileUpsertError);
      }

      // 2) Fetch role (select)
      const { data: roleRow, error: roleFetchError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supabaseUser.id)
        .maybeSingle();

      if (roleFetchError) {
        logger.error("Role fetch error:", roleFetchError);
      }

      // 3) If role missing, insert default role ONCE (insert only)
      let finalRole: AppRole = (roleRow?.role as AppRole) || "reporter";

      if (!roleRow) {
        const { error: roleInsertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: supabaseUser.id,
            role: "reporter",
          });

        if (roleInsertError) {
          logger.error("Role insert error:", roleInsertError);
        } else {
          finalRole = "reporter";
        }
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: profile?.name || fallbackName,
        role: finalRole,
        emailVerified: supabaseUser.email_confirmed_at !== null,
      });
    } catch (err) {
      logger.error("fetchUserData fatal error:", err);
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          "",
        role: "reporter",
        emailVerified: supabaseUser.email_confirmed_at !== null,
      });
    }
  };

  // Set up Supabase auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user);
        }, 0);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setLastActivity(Date.now());

      toast({
        title: "Logged in successfully",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup: no manual inserts; fetchUserData will handle profile/role creation after auth state changes
  const signup = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setLoading(true);

      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: name },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Welcome! Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (rememberMe: boolean = false): Promise<void> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });

      if (error) throw error;

      setLastActivity(Date.now());
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const isAdmin = () => user?.role === "admin";

  const resendVerificationEmail = async (): Promise<void> => {
    try {
      if (!user?.email) throw new Error("No user email found");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your inbox and verify your email address.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send verification email",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    signInWithGoogle,
    logout,
    isAdmin,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
