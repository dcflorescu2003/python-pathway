import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import type { User, Session } from "@supabase/supabase-js";

const PRODUCTION_URL = 'https://pyro-learn.lovable.app';

const getRedirectUri = () => {
  if (Capacitor.isNativePlatform()) {
    return 'pyro://auth';
  }
  return window.location.origin;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithOAuthNative = async (provider: "google" | "apple") => {
    try {
      // Get the OAuth URL from Lovable but don't let it redirect
      // We need to manually open it in an in-app browser
      const redirectUri = getRedirectUri();
      
      // For native, we use the production URL as redirect and handle the deep link
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: PRODUCTION_URL,
      });
      
      return { error: result.error || null };
    } catch (err) {
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      return signInWithOAuthNative("google");
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error || null };
  };

  const signInWithApple = async () => {
    if (Capacitor.isNativePlatform()) {
      return signInWithOAuthNative("apple");
    }
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
