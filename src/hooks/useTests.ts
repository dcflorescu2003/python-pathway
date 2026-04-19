import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TestItem {
  id?: string;
  test_id?: string;
  variant: string;
  sort_order: number;
  source_type: string;
  source_id: string | null;
  custom_data: any | null;
  points: number;
}

export function useTeacherTests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-tests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTestItems(testId: string | null) {
  return useQuery({
    queryKey: ["test-items", testId],
    queryFn: async () => {
      if (!testId) return [];
      const { data, error } = await supabase
        .from("test_items")
        .select("*")
        .eq("test_id", testId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!testId,
  });
}

export function useCreateTest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      time_limit_minutes: number | null;
      variant_mode: string;
      items: TestItem[];
      allow_run_tests?: boolean;
      require_fullscreen?: boolean;
      ai_grading_item_ids?: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: test, error } = await supabase
        .from("tests")
        .insert({
          teacher_id: user.id,
          title: params.title,
          time_limit_minutes: params.time_limit_minutes,
          variant_mode: params.variant_mode,
          allow_run_tests: params.allow_run_tests ?? false,
          require_fullscreen: params.require_fullscreen ?? false,
          ai_grading_item_ids: params.ai_grading_item_ids ?? [],
        })
        .select()
        .single();
      if (error) throw error;

      if (params.items.length > 0) {
        const itemsToInsert = params.items.map((item, idx) => ({
          test_id: test.id,
          variant: item.variant,
          sort_order: idx,
          source_type: item.source_type,
          source_id: item.source_id,
          custom_data: item.custom_data,
          points: item.points,
        }));
        const { error: itemsError } = await supabase.from("test_items").insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }
      return test;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-tests"] }),
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      time_limit_minutes: number | null;
      variant_mode: string;
      items: TestItem[];
      allow_run_tests?: boolean;
      require_fullscreen?: boolean;
      ai_grading_item_ids?: string[];
    }) => {
      // Update test metadata
      const { error: testError } = await supabase
        .from("tests")
        .update({
          title: params.title,
          time_limit_minutes: params.time_limit_minutes,
          variant_mode: params.variant_mode,
          allow_run_tests: params.allow_run_tests ?? false,
          require_fullscreen: params.require_fullscreen ?? false,
          ai_grading_item_ids: params.ai_grading_item_ids ?? [],
        })
        .eq("id", params.id);
      if (testError) throw testError;

      // Delete old items and re-insert
      const { error: delError } = await supabase
        .from("test_items")
        .delete()
        .eq("test_id", params.id);
      if (delError) throw delError;

      if (params.items.length > 0) {
        const itemsToInsert = params.items.map((item, idx) => ({
          test_id: params.id,
          variant: item.variant,
          sort_order: idx,
          source_type: item.source_type,
          source_id: item.source_id,
          custom_data: item.custom_data,
          points: item.points,
        }));
        const { error: insError } = await supabase.from("test_items").insert(itemsToInsert);
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-tests"] });
      qc.invalidateQueries({ queryKey: ["test-items"] });
    },
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase.from("tests").delete().eq("id", testId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-tests"] }),
  });
}

export function useAssignTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { test_id: string; class_id: string; due_date?: string }) => {
      const { data, error } = await supabase
        .from("test_assignments")
        .insert({
          test_id: params.test_id,
          class_id: params.class_id,
          due_date: params.due_date || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test-assignments"] }),
  });
}

export function useTestAssignments(testId: string | null) {
  return useQuery({
    queryKey: ["test-assignments", testId],
    queryFn: async () => {
      if (!testId) return [];
      const { data, error } = await supabase
        .from("test_assignments")
        .select("*, teacher_classes(name)")
        .eq("test_id", testId)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!testId,
  });
}

export function useTestSubmissions(assignmentId: string | null) {
  return useQuery({
    queryKey: ["test-submissions", assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const { data, error } = await supabase
        .from("test_submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles
      const studentIds = data.map((s) => s.student_id);
      if (studentIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", studentIds);

      return data.map((s) => ({
        ...s,
        profile: profiles?.find((p) => p.user_id === s.student_id) || null,
      }));
    },
    enabled: !!assignmentId,
  });
}

export function useTestAnswers(submissionId: string | null) {
  return useQuery({
    queryKey: ["test-answers", submissionId],
    queryFn: async () => {
      if (!submissionId) return [];
      const { data, error } = await supabase
        .from("test_answers")
        .select("*")
        .eq("submission_id", submissionId);
      if (error) throw error;
      return data;
    },
    enabled: !!submissionId,
  });
}

// Student hooks
export function useStudentAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student-test-assignments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get class memberships
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id);
      if (!memberships || memberships.length === 0) return [];

      const classIds = memberships.map((m) => m.class_id);
      const { data, error } = await supabase
        .from("test_assignments")
        .select("*, tests(title, time_limit_minutes, variant_mode), teacher_classes(name)")
        .in("class_id", classIds)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false });
      if (error) throw error;

      // Check existing submissions
      const assignmentIds = (data || []).map((a) => a.id);
      if (assignmentIds.length === 0) return data || [];

      const { data: submissions } = await supabase
        .from("test_submissions")
        .select("id, assignment_id, submitted_at, total_score, max_score")
        .eq("student_id", user.id)
        .in("assignment_id", assignmentIds);

      return (data || []).map((a) => ({
        ...a,
        submission: submissions?.find((s) => s.assignment_id === a.id) || null,
      }));
    },
    enabled: !!user,
  });
}

export function useStartSubmission() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { assignment_id: string; variant: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("test_submissions")
        .insert({
          assignment_id: params.assignment_id,
          student_id: user.id,
          variant: params.variant,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-test-assignments"] }),
  });
}

export function useSubmitTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      submission_id: string;
      answers: { test_item_id: string; answer_data: any; max_points: number }[];
      auto_submitted_reason?: string | null;
    }) => {
      // Insert answers
      const answersToInsert = params.answers.map((a) => ({
        submission_id: params.submission_id,
        test_item_id: a.test_item_id,
        answer_data: a.answer_data,
        max_points: a.max_points,
        score: 0,
      }));
      const { error: ansError } = await supabase.from("test_answers").insert(answersToInsert);
      if (ansError) throw ansError;

      // Mark as submitted (with optional auto-submit reason)
      const updatePayload: Record<string, any> = { submitted_at: new Date().toISOString() };
      if (params.auto_submitted_reason) {
        updatePayload.auto_submitted_reason = params.auto_submitted_reason;
      }
      const { error: subError } = await supabase
        .from("test_submissions")
        .update(updatePayload)
        .eq("id", params.submission_id);
      if (subError) throw subError;

      // Invoke grading
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/grade-submission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_id: params.submission_id }),
        }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-test-assignments"] });
      qc.invalidateQueries({ queryKey: ["test-submissions"] });
    },
  });
}

export function useUpdateAnswerScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { answerId: string; score: number; submissionId: string; feedback?: string }) => {
      const updateData: Record<string, any> = { score: params.score };
      if (params.feedback !== undefined) {
        updateData.feedback = params.feedback;
      }
      const { error } = await supabase
        .from("test_answers")
        .update(updateData)
        .eq("id", params.answerId);
      if (error) throw error;

      // Recalculate submission totals
      const { data: allAnswers } = await supabase
        .from("test_answers")
        .select("score, max_points")
        .eq("submission_id", params.submissionId);

      if (allAnswers) {
        const totalScore = allAnswers.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
        const maxScore = allAnswers.reduce((sum, a) => sum + (Number(a.max_points) || 0), 0);
        await supabase
          .from("test_submissions")
          .update({ total_score: totalScore, max_score: maxScore })
          .eq("id", params.submissionId);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["test-answers"] });
      qc.invalidateQueries({ queryKey: ["test-submissions"] });
    },
  });
}

export function useToggleScoresReleased() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { assignmentId: string; released: boolean; testTitle?: string }) => {
      const { error } = await supabase
        .from("test_assignments")
        .update({ scores_released: params.released })
        .eq("id", params.assignmentId);
      if (error) throw error;

      // Send notifications to students when scores are released
      if (params.released) {
        try {
          // Get class_id from the assignment
          const { data: assignment } = await supabase
            .from("test_assignments")
            .select("class_id")
            .eq("id", params.assignmentId)
            .single();

          if (assignment?.class_id) {
            // Get all students in the class
            const { data: members } = await supabase
              .from("class_members")
              .select("student_id")
              .eq("class_id", assignment.class_id);

            if (members && members.length > 0) {
              const title = params.testTitle || "Test";
              const notifications = members.map((m) => ({
                user_id: m.student_id,
                title: "Rezultate publicate",
                body: `Notele pentru testul «${title}» au fost publicate.`,
              }));
              await supabase.from("notifications").insert(notifications);
            }
          }
        } catch (e) {
          console.error("Failed to send score notifications:", e);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-assignments"] });
      qc.invalidateQueries({ queryKey: ["student-test-assignments"] });
    },
  });
}
