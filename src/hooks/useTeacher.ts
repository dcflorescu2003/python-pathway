import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useTeacherClasses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // RLS returns own classes + classes where the user is a co-teacher.
      const { data, error } = await supabase
        .from("teacher_classes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({ ...c, is_owner: c.teacher_id === user.id }));
    },
    enabled: !!user,
  });
}

export function useClassTeachers(classId: string | null) {
  return useQuery({
    queryKey: ["class-teachers", classId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_class_teachers", { p_class_id: classId });
      if (error) throw error;
      return (data ?? []) as { user_id: string; display_name: string | null; role: "owner" | "co" }[];
    },
    enabled: !!classId,
  });
}

export function useCreateCoTeacherInvite() {
  return useMutation({
    mutationFn: async (classId: string) => {
      const { data, error } = await (supabase as any).rpc("create_co_teacher_invite", { p_class_id: classId });
      if (error) throw error;
      return data as { code: string; expires_at: string };
    },
  });
}

export function useAcceptCoTeacherInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await (supabase as any).rpc("accept_co_teacher_invite", { p_code: code });
      if (error) throw error;
      return data as { class_id: string; name: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes"] }),
  });
}

export function useRemoveCoTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string }) => {
      const { error } = await (supabase as any).rpc("remove_co_teacher", { p_class_id: classId, p_teacher_id: teacherId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-teachers"] });
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
    },
  });
}

export function useClassMembers(classId: string | null) {
  return useQuery({
    queryKey: ["class-members", classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from("class_members")
        .select("*")
        .eq("class_id", classId);
      if (error) throw error;

      const studentIds = data.map((m) => m.student_id);
      if (studentIds.length === 0) return [];

      const { data: profiles } = await (supabase as any).rpc("get_students_for_teacher", {
        p_student_ids: studentIds,
      });

      return data.map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.user_id === m.student_id) || null,
      }));
    },
    enabled: !!classId,
  });
}

export function useClassChallenges(classId: string | null) {
  return useQuery({
    queryKey: ["class-challenges", classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");

      const maxAttempts = 5;
      let lastError: any = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const join_code = generateJoinCode();
        const { data, error } = await supabase
          .from("teacher_classes")
          .insert({ teacher_id: user.id, name, join_code })
          .select()
          .single();

        if (!error) return data;

        // Unique violation (23505) likely means join_code collision; retry once with a fresh code.
        if (error.code === "23505") {
          lastError = error;
          continue;
        }

        // Any other error is not recoverable by retrying.
        throw error;
      }

      throw new Error(
        lastError
          ? "Codul clasei a fost generat de mai multe ori, dar există deja. Te rugăm să încerci din nou."
          : "Nu s-a putut crea clasa. Te rugăm să încerci din nou."
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes"] }),
  });
}

export function useRenameClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, name }: { classId: string; name: string }) => {
      const { error } = await supabase
        .from("teacher_classes")
        .update({ name })
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from("teacher_classes")
        .delete()
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes"] }),
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (challenges: { class_id: string; item_type: string; item_id: string; due_date?: string | null; group_id?: string; group_title?: string | null }[]) => {
      const { error } = await supabase.from("challenges").insert(challenges);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-challenges"] }),
  });
}

export function useUpdateChallengeDueDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, due_date }: { id: string; due_date: string | null }) => {
      const { error } = await supabase.from("challenges").update({ due_date }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-challenges"] }),
  });
}

export function useUpdateChallengeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: { due_date?: string | null; group_title?: string | null } }) => {
      const { error } = await supabase.from("challenges").update(patch).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-challenges"] }),
  });
}

export function useDeleteChallengeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("challenges").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-challenges"] }),
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase.from("challenges").delete().eq("id", challengeId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-challenges"] }),
  });
}

export function useTeacherReferralCodes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-referral-codes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("teacher_referral_codes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
