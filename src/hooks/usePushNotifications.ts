import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const register = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await PushNotifications.register();

      PushNotifications.addListener("registration", async (token) => {
        // Upsert device token
        await supabase.from("device_tokens" as any).upsert(
          {
            user_id: user.id,
            token: token.value,
            platform: Capacitor.getPlatform(),
          },
          { onConflict: "user_id,token" }
        );
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
