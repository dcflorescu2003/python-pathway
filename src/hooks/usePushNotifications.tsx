import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const register = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await PushNotifications.register();

      PushNotifications.addListener("registration", async (token) => {
        const platform = Capacitor.getPlatform();
        // Check if a row already exists for this token to preserve learned apns_environment
        const { data: existing } = await supabase
          .from("device_tokens" as any)
          .select("apns_environment")
          .eq("user_id", user.id)
          .eq("token", token.value)
          .maybeSingle();

        const payload: Record<string, any> = {
          user_id: user.id,
          token: token.value,
          platform,
        };
        // Preserve previously-learned environment, or set null for new iOS tokens
        // (edge function will auto-detect and persist on first send).
        if (platform === "ios") {
          payload.apns_environment = (existing as any)?.apns_environment ?? null;
        }

        await supabase.from("device_tokens" as any).upsert(payload, {
          onConflict: "user_id,token",
        });
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error:", err);
      });
    };

    register();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);
}

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  usePushRegistration();
  return <>{children}</>;
}
