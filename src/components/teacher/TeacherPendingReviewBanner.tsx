import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const TeacherPendingReviewBanner = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useQuery({
    queryKey: ["teacher-pending-submissions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: tests } = await supabase
        .from("tests")
        .select("id")
        .eq("teacher_id", user.id);

      if (!tests || tests.length === 0) {
        setPendingCount(0);
        return 0;
      }

      const testIds = tests.map((t) => t.id);
      const { data: assignments } = await supabase
        .from("test_assignments")
        .select("id")
        .in("test_id", testIds);

      if (!assignments || assignments.length === 0) {
        setPendingCount(0);
        return 0;
      }

      const { count } = await supabase
        .from("test_submissions")
        .select("id", { count: "exact", head: true })
        .in("assignment_id", assignments.map((a) => a.id))
        .not("submitted_at", "is", null)
        .is("graded_at", null)
        .lt("submitted_at", oneDayAgo);

      const c = count ?? 0;
      setPendingCount(c);
      return c;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  if (pendingCount === 0) return null;

  return (
    <Link
      to="/account?tab=tests"
      className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 hover:bg-warning/15 transition-colors"
    >
      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {pendingCount === 1
            ? "1 submisie ne-evaluată"
            : `${pendingCount} submisii ne-evaluate`}
        </p>
        <p className="text-xs text-muted-foreground">
          Sunt în așteptare de peste 24h. Apasă pentru a le evalua.
        </p>
      </div>
    </Link>
  );
};

export default TeacherPendingReviewBanner;
