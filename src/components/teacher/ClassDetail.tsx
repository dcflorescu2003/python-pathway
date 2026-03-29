import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClassMembers, useClassChallenges, useDeleteChallenge } from "@/hooks/useTeacher";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import ChallengeAssigner from "./ChallengeAssigner";
import { ArrowLeft, Copy, Trash2, Target, BookOpen, Code, Zap, Flame } from "lucide-react";
import { toast } from "sonner";

interface ClassDetailProps {
  classId: string;
  className: string;
  joinCode: string;
  onBack: () => void;
}

const ClassDetail = ({ classId, className: clsName, joinCode, onBack }: ClassDetailProps) => {
  const { data: members = [] } = useClassMembers(classId);
  const { data: challenges = [] } = useClassChallenges(classId);
  const deleteChallenge = useDeleteChallenge();
  const { data: chapters = [] } = useChapters();
  const { problemChapters = [] } = useProblems();
  const [showAssigner, setShowAssigner] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast.success("Cod copiat!");
  };

  const getItemName = (type: string, itemId: string): string => {
    if (type === "lesson") {
      for (const ch of chapters) {
        const lesson = ch.lessons.find((l) => l.id === itemId);
        if (lesson) return lesson.title;
      }
    } else {
      for (const ch of problemChapters) {
        const problem = ch.problems.find((p) => p.id === itemId);
        if (problem) return problem.title;
      }
    }
    return itemId;
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      await deleteChallenge.mutateAsync(id);
      toast.success("Provocare eliminată.");
    } catch {
      toast.error("Eroare.");
    }
  };

  const existingChallengeIds = challenges.map((c) => c.item_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{clsName}</h2>
          <button onClick={copyCode} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Copy className="h-3 w-3" /> Cod: {joinCode}
          </button>
        </div>
      </div>

      {/* Students */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          Elevi ({members.length})
        </h3>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun elev înscris încă.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {m.profile?.display_name || "Elev"}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-xp" /> {m.profile?.xp ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-warning" /> {m.profile?.streak ?? 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Challenges */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Provocări ({challenges.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowAssigner(true)} className="gap-1">
            <Target className="h-3.5 w-3.5" /> Atribuie
          </Button>
        </div>

        {showAssigner && (
          <Card className="mb-3">
            <CardContent className="p-4">
              <ChallengeAssigner
                classId={classId}
                existingChallengeIds={existingChallengeIds}
                onClose={() => setShowAssigner(false)}
              />
            </CardContent>
          </Card>
        )}

        {challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nicio provocare atribuită.</p>
        ) : (
          <div className="space-y-2">
            {challenges.map((ch) => (
              <Card key={ch.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ch.item_type === "lesson" ? (
                      <BookOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Code className="h-4 w-4 text-accent-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{getItemName(ch.item_type, ch.item_id)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ch.created_at).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteChallenge(ch.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetail;
