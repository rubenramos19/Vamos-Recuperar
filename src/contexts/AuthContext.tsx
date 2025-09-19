
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: "reporter" | "admin";
} | null;

interface AuthContextType {
  user: AuthUser;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Set up auth state listener and get initial session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Convert Supabase user to our AuthUser type
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
            role: session.user.user_metadata?.role || 'reporter'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role || 'reporter'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Logged in successfully",
        description: `Welcome back!`,
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

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            full_name: name,
            role: 'reporter'
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account created",
        description: "Welcome to CivicSpot! Please check your email to verify your account.",
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

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }
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

  const signInWithPhone = async (phone: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "OTP sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Phone sign in failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone: string, token: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Phone verified successfully",
        description: "Welcome to CivicSpot!",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
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
      
      if (error) {
        throw error;
      }

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

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const value = {
    user,
    session,
    loading,
    login,
    signup,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
