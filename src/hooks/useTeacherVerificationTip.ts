import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const key = (uid: string) => `pyro-teacher-verify-tip-lastshown:${uid}`;

/**
 * Afișează cartonașul cu instrucțiuni de verificare pentru conturile de
 * profesor neverificate (status lipsă, "unverified" sau "pending").
 * Se arată maxim o dată pe zi, atât pe web cât și în aplicația nativă.
 */
export function useTeacherVerificationTip() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    setShow(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user || dismissed) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_teacher, teacher_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled || !data?.is_teacher) return;
      if (data.teacher_status === "verified") return;

      const todayStr = new Date().toDateString();
      if (localStorage.getItem(key(user.id)) === todayStr) return;
      localStorage.setItem(key(user.id), todayStr);
      setShow(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setShow(false);
  }, []);

  return { show, dismiss };
}
