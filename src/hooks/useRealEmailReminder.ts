import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthMethods } from "@/hooks/useAuthMethods";

interface ReminderState {
  shouldShow: boolean;
  loading: boolean;
  markShown: () => Promise<void>;
  dismissForever: () => Promise<void>;
  refresh: () => Promise<void>;
  hasVerifiedRealEmail: boolean;
}

const HOUR_THRESHOLD = 14; // 14:00 local

export function useRealEmailReminder(): ReminderState {
  const { user } = useAuth();
  const { isPrivateRelay, loading: methodsLoading } = useAuthMethods();
  const [shouldShow, setShouldShow] = useState(false);
  const [hasVerifiedRealEmail, setHasVerifiedRealEmail] = useState(false);
  const [loading, setLoading] = useState(true);

  const evaluate = useCallback(async () => {
    if (!user || methodsLoading) return;
    if (!isPrivateRelay) {
      setShouldShow(false);
      setHasVerifiedRealEmail(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("user_email_reminders")
      .select("last_shown_date, dismissed_forever, verified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const verified = !!data?.verified_at;
    setHasVerifiedRealEmail(verified);

    if (verified || data?.dismissed_forever) {
      setShouldShow(false);
      setLoading(false);
      return;
    }

    const now = new Date();
    if (now.getHours() < HOUR_THRESHOLD) {
      setShouldShow(false);
      setLoading(false);
      return;
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const alreadyShown = data?.last_shown_date === todayStr;
    setShouldShow(!alreadyShown);
    setLoading(false);
  }, [user, isPrivateRelay, methodsLoading]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") evaluate();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [evaluate]);

  const markShown = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await supabase.from("user_email_reminders").upsert(
      { user_id: user.id, last_shown_date: todayStr },
      { onConflict: "user_id" }
    );
    setShouldShow(false);
  }, [user]);

  const dismissForever = useCallback(async () => {
    if (!user) return;
    await supabase.from("user_email_reminders").upsert(
      { user_id: user.id, dismissed_forever: true },
      { onConflict: "user_id" }
    );
    setShouldShow(false);
  }, [user]);

  return { shouldShow, loading, markShown, dismissForever, refresh: evaluate, hasVerifiedRealEmail };
}
