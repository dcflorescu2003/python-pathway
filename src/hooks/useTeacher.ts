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
      const { data, error } = await supabase
        .from("teacher_classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, last_name, first_name, xp, streak, avatar_url")
        .in("user_id", studentIds);

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
      const join_code = generateJoinCode();
      const { data, error } = await supabase
        .from("teacher_classes")
        .insert({ teacher_id: user.id, name, join_code })
        .select()
        .single();
      if (error) throw error;
      return data;
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
    mutationFn: async (challenges: { class_id: string; item_type: string; item_id: string }[]) => {
      const { error } = await supabase.from("challenges").insert(challenges);
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
