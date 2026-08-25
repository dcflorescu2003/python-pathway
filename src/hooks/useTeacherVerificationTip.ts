import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const key = (uid: string) => `pyro-teacher-verify-tip-lastshown:${uid}`;

export type TeacherVerificationDetails = {
  profileStatus: string | null;
  requestStatus: "pending" | "rejected" | null;
  method: string | null;
  adminNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

const methodLabels: Record<string, string> = {
  invite_code: "cod de invitație",
  referral: "cod de la un profesor",
  public_link: "link public",
  document: "document",
};

function labelizeMethod(method: string | null): string {
  if (!method) return "document";
  return methodLabels[method] || method;
}

/**
 * Afișează cartonașul cu instrucțiuni de verificare pentru conturile de
 * profesor neverificate (status lipsă, "unverified" sau "pending").
 * Se arată maxim o dată pe zi, atât pe web cât și în aplicația nativă.
 * Returnează și detaliile cererii de verificare pentru a personaliza mesajul.
 */
export function useTeacherVerificationTip() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [details, setDetails] = useState<TeacherVerificationDetails | null>(null);

  useEffect(() => {
    setDismissed(false);
    setShow(false);
    setDetails(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user || dismissed) return;
    let cancelled = false;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_teacher, teacher_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled || !profile?.is_teacher) return;
      if (profile.teacher_status === "verified") return;

      const profileStatus = profile.teacher_status ?? null;

      // Fetch the most recent non-approved verification request
      const { data: requests } = await supabase
        .from("teacher_verification_requests")
        .select("status, method, admin_notes, created_at, reviewed_at")
        .eq("user_id", user.id)
        .not("status", "eq", "approved")
        .order("created_at", { ascending: false })
        .limit(1);

      const req = requests?.[0];
      const details: TeacherVerificationDetails = {
        profileStatus,
        requestStatus: req?.status === "pending" || req?.status === "rejected" ? req.status : null,
        method: labelizeMethod(req?.method ?? null),
        adminNotes: req?.admin_notes ?? null,
        submittedAt: req?.created_at ?? null,
        reviewedAt: req?.reviewed_at ?? null,
      };

      if (cancelled) return;

      const todayStr = new Date().toDateString();
      if (localStorage.getItem(key(user.id)) === todayStr) return;
      localStorage.setItem(key(user.id), todayStr);
      setDetails(details);
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

  return { show, dismiss, details };
}

