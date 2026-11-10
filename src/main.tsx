import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";
import { installNativeAuthPersistence } from "./integrations/supabase/native-persistence";
import "./index.css";

async function bootstrap() {
  // On Capacitor (iOS/Android) we need to rehydrate the Supabase session from
  // durable native storage BEFORE the supabase client is imported, otherwise
  // WKWebView's localStorage may have been evicted by iOS and the user gets
  // logged out moments after login. On web this is a no-op.
  if (Capacitor.isNativePlatform()) {
    try {
      await installNativeAuthPersistence();
    } catch (err) {
      console.warn("[bootstrap] native auth persistence failed", err);
    }
  }

  try {
    const { shouldDropSessionOnStart, clearRememberMe } = await import("./lib/rememberMe");
    if (shouldDropSessionOnStart()) {
      const { supabase } = await import("./integrations/supabase/client");
      await supabase.auth.signOut({ scope: "local" });
      clearRememberMe();
    }
  } catch (err) {
    console.warn("[bootstrap] remember-me check failed", err);
  }

  const { default: App } = await import("./App.tsx");
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
}

bootstrap();
