import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import type { User, Session } from "@supabase/supabase-js";

const PRODUCTION_URL = 'https://pyroskill.info';
const OAUTH_BROKER_URL = `${PRODUCTION_URL}/~oauth/initiate`;
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = "500659609573-544m8gs54gukhl5vn1so298rvuvaif67.apps.googleusercontent.com";
const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

const getRedirectUri = () => {
  if (Capacitor.isNativePlatform()) {
    return PRODUCTION_URL;
  }
  return window.location.origin;
};

const generateOAuthState = () => {
  const browserCrypto = globalThis.crypto;

  if (browserCrypto?.randomUUID) {
    return browserCrypto.randomUUID();
  }

  if (browserCrypto?.getRandomValues) {
    return Array.from(browserCrypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

async function initializeNativeGoogleLogin() {
  if (isNativeIOS) {
    // iOS folosește iOS Client ID-ul nativ. webClientId rămâne necesar pentru
    // ca idToken-ul să fie emis cu audience web (acceptat de Lovable Cloud).
    await SocialLogin.initialize({
      google: {
        iOSClientId: GOOGLE_IOS_CLIENT_ID,
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      } as any,
    });
    return;
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error("Lipsește VITE_GOOGLE_WEB_CLIENT_ID pentru login-ul Google nativ pe Android.");
  }

  await SocialLogin.initialize({
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      mode: "online",
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isNativeAndroid && !isNativeIOS) return;

    const initPromises: Promise<void>[] = [];

    if (isNativeAndroid && GOOGLE_WEB_CLIENT_ID) {
      initPromises.push(
        initializeNativeGoogleLogin().catch((error) => {
          console.error("Failed to initialize native Google login:", error);
        })
      );
    }

    if (isNativeIOS) {
      initPromises.push(
        initializeNativeGoogleLogin().catch((error) => {
          console.error("Failed to initialize native iOS Google login:", error);
        })
      );
    }

    // Apple is available on both iOS and Android
    initPromises.push(
      SocialLogin.initialize({ apple: {} }).catch((error) => {
        console.error("Failed to initialize native Apple login:", error);
      })
    );

    Promise.all(initPromises);
  }, []);

  useEffect(() => {
    let resolved = false;
    let lastKnownSession: Session | null = null;
    const markResolved = () => {
      resolved = true;
      setLoading(false);
    };

    const isNative = Capacitor.isNativePlatform();

    const applySession = (next: Session | null) => {
      lastKnownSession = next;
      setSession(next);
      setUser(next?.user ?? null);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Pe iOS WKWebView se întâmplă uneori să primim un SIGNED_OUT tranzitoriu
      // imediat după login, când WebView-ul nu a apucat să persiste încă tokenul.
      // Verificăm direct storage-ul (Preferences-backed via native-persistence shim);
      // dacă găsim o sesiune validă, ignorăm evenimentul fals și forțăm un retry.
      if (
        isNative &&
        event === "SIGNED_OUT" &&
        lastKnownSession &&
        Date.now() - (lastKnownSession.expires_at ?? 0) * 1000 < 0
      ) {
        // Sesiunea pe care o avem nu e expirată — ignorăm SIGNED_OUT-ul și
        // încercăm un getSession() care va citi din Preferences via shim.
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            applySession(data.session);
          } else {
            applySession(null);
          }
          markResolved();
        });
        return;
      }
      applySession(session);
      markResolved();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      markResolved();
    }).catch(() => markResolved());

    // Plasă de siguranță: dacă restaurarea sesiunii rămâne blocată (rețea / storage),
    // marcăm auth ca „gata" după 4s ca să nu rămână UI-ul în loading infinit.
    const safety = setTimeout(() => {
      if (!resolved) markResolved();
    }, 4000);

    return () => {
      clearTimeout(safety);
      subscription.unsubscribe();
    };
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

  const signInWithNativeGoogle = async () => {
    try {
      await initializeNativeGoogleLogin();

      const response = await SocialLogin.login({
        provider: "google",
        options: {},
      } as any);

      const result = response.result as any;

      if (result.responseType !== "online") {
        throw new Error("Google login a revenit într-un mod neașteptat.");
      }

      if (!result.idToken) {
        throw new Error("Google login nu a returnat un ID token.");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: result.idToken,
        access_token: result.accessToken?.token ?? undefined,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithOAuthNative = async (provider: "google" | "apple") => {
    try {
      const redirectUri = getRedirectUri();
      const params = new URLSearchParams({
        provider,
        redirect_uri: redirectUri,
        state: `native:${generateOAuthState()}`,
      });

      await Browser.open({
        url: `${OAUTH_BROKER_URL}?${params.toString()}`,
        presentationStyle: "popover",
      });

      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    if (isNativeAndroid || isNativeIOS) {
      return signInWithNativeGoogle();
    }
    if (Capacitor.isNativePlatform()) {
      return signInWithOAuthNative("google");
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error || null };
  };

  const signInWithNativeApple = async () => {
    try {
      await SocialLogin.initialize({ apple: {} });

      const response = await SocialLogin.login({
        provider: "apple",
        options: {
          scopes: ["email", "fullName"],
        },
      } as any);

      const result = response.result as any;

      if (!result.idToken) {
        throw new Error("Apple login nu a returnat un ID token.");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: result.idToken,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithApple = async () => {
    if (isNativeAndroid || isNativeIOS) {
      return signInWithNativeApple();
    }
    if (Capacitor.isNativePlatform()) {
      return signInWithOAuthNative("apple");
    }
    // Web: flux Lovable Cloud managed (cum era inițial).
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error || null };
  };

  const signOut = async () => {
    if (isNativeAndroid) {
      await SocialLogin.logout({ provider: "google" }).catch(() => undefined);
    }
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
