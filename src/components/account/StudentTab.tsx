import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, DoorOpen, Trophy, Clock, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";

interface StudentTabProps {
  memberClassName: string | null;
  onLeaveClass: () => void;
}

const StudentTab = ({ memberClassName, onLeaveClass }: StudentTabProps) => {
  const { user } = useAuth();
  const [leavingClass, setLeavingClass] = useState(false);

  // Get student's class membership
  const { data: membership } = useQuery({
    queryKey: ["student-membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get challenges for the student's class
  const { data: challenges = [] } = useQuery({
    queryKey: ["student-challenges", membership?.class_id],
    queryFn: async () => {
      if (!membership?.class_id) return [];
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("class_id", membership.class_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!membership?.class_id,
  });

  // Get test assignments for the student's class
  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments", membership?.class_id],
    queryFn: async () => {
      if (!membership?.class_id) return [];
      const { data, error } = await supabase
        .from("test_assignments")
        .select("*, tests(title, time_limit_minutes)")
        .eq("class_id", membership.class_id)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!membership?.class_id,
  });

  // Get student's submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ["student-submissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("test_submissions")
        .select("*")
        .eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleLeave = async () => {
    if (!user) return;
    setLeavingClass(true);
    try {
      const { error } = await supabase
        .from("class_members")
        .delete()
        .eq("student_id", user.id);
      if (error) {
        toast.error("Eroare la părăsirea clasei.");
      } else {
        toast.success("Ai părăsit clasa.");
        onLeaveClass();
      }
    } finally {
      setLeavingClass(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Class info */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{memberClassName ?? "Clasa ta"}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              disabled={leavingClass}
              onClick={handleLeave}
            >
              <DoorOpen className="h-4 w-4" />
              {leavingClass ? "..." : "Părăsește"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Challenges */}
      {challenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Provocări ({challenges.length})
          </h3>
          <div className="space-y-2">
            {challenges.map((ch) => (
              <Card key={ch.id} className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ch.item_type === "lesson" ? "Lecție" : ch.item_type === "problem" ? "Problemă" : ch.item_type}
                    </p>
                    <p className="text-xs text-muted-foreground">{ch.item_id}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Test assignments */}
      {assignments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Teste ({assignments.length})
          </h3>
          <div className="space-y-2">
            {assignments.map((a: any) => {
              const submission = submissions.find((s) => s.assignment_id === a.id);
              const isCompleted = !!submission?.submitted_at;
              const isExpired = a.due_date && new Date(a.due_date) < new Date();

              return (
                <Card key={a.id} className="border-border">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCompleted ? "bg-green-500/10" : isExpired ? "bg-destructive/10" : "bg-primary/10"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isExpired ? (
                          <Clock className="h-4 w-4 text-destructive" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.tests?.title || "Test"}</p>
                        <p className="text-xs text-muted-foreground">
                          {isCompleted ? `Scor: ${submission?.total_score ?? 0}/${submission?.max_score ?? 0}` :
                           isExpired ? "Expirat" : "Activ"}
                        </p>
                      </div>
                    </div>
                    {a.tests?.time_limit_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {a.tests.time_limit_minutes}min
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {challenges.length === 0 && assignments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nicio provocare sau test primit încă.</p>
        </div>
      )}
    </div>
  );
};

export default StudentTab;
