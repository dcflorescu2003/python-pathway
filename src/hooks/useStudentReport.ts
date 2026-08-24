import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import {
  fetchClassAssignments,
  fetchManualLessonTitles,
  fetchStudentReport,
  type StudentProfileLike,
  type StudentReportData,
} from "@/lib/studentReportData";

export function useReportDeps(classId: string | null) {
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();

  const { data: manualTitles = {} } = useQuery({
    queryKey: ["manual-lesson-titles"],
    queryFn: fetchManualLessonTitles,
    staleTime: 5 * 60 * 1000,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["report-assignments", classId],
    queryFn: () => fetchClassAssignments(classId as string),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000,
  });

  const problemChapterTitleById = useMemo(() => {
    const chTitle: Record<string, string> = {};
    (problemsData?.problemChapters ?? []).forEach((c) => { chTitle[c.id] = c.title; });
    const map: Record<string, string> = {};
    (problemsData?.problems ?? []).forEach((p) => {
      map[p.id] = chTitle[p.chapter] ?? p.chapter ?? "Alte probleme";
    });
    return map;
  }, [problemsData]);

  return { chapters, manualTitles, assignments, problemChapterTitleById };
}

export function useStudentReport(
  classId: string | null,
  profile: StudentProfileLike | null | undefined
) {
  const deps = useReportDeps(classId);
  const ready = deps.chapters.length > 0 && !!profile;

  return useQuery<StudentReportData>({
    queryKey: ["student-report", classId, profile?.user_id, deps.assignments.length, deps.chapters.length],
    enabled: ready,
    staleTime: 2 * 60 * 1000,
    queryFn: () => fetchStudentReport(profile as StudentProfileLike, deps),
  });
}
