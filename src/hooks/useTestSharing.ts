import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const pushForTest = (testId: string) =>
  supabase.functions.invoke("send-push", { body: { test_chat_test_id: testId } }).catch(() => {});

export function useColleagues() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-colleagues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_colleagues");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTestShares(testId: string | null) {
  return useQuery({
    queryKey: ["test-shares", testId],
    enabled: !!testId,
    queryFn: async () => {
      const { data, error } = await supabase.from("test_shares").select("shared_with").eq("test_id", testId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.shared_with);
    },
  });
}

export function useShareTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, teacherIds }: { testId: string; teacherIds: string[] }) => {
      const { error } = await supabase.rpc("share_test", { p_test_id: testId, p_teacher_ids: teacherIds });
      if (error) throw error;
      pushForTest(testId);
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["test-shares", v.testId] }),
  });
}

export function useSharedTests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shared-tests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_tests");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDuplicateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (testId: string) => {
      const { data, error } = await supabase.rpc("duplicate_test", { p_test_id: testId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-tests"] }),
  });
}

export function useTestMessages(testId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["test-messages", testId],
    enabled: !!testId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_test_messages", { p_test_id: testId! });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!testId) return;
    const channel = supabase
      .channel(`test-messages-${testId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "test_messages", filter: `test_id=eq.${testId}` },
        () => qc.invalidateQueries({ queryKey: ["test-messages", testId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [testId, qc]);

  return query;
}

export function useSendTestMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ testId, body }: { testId: string; body: string }) => {
      const { error } = await supabase.from("test_messages").insert({ test_id: testId, sender_id: user!.id, body });
      if (error) throw error;
      pushForTest(testId);
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["test-messages", v.testId] }),
  });
}
