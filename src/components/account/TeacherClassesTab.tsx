import { useState } from "react";
import { useTeacherClasses, useTeacherReferralCodes } from "@/hooks/useTeacher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import ClassManager from "@/components/teacher/ClassManager";
import ClassDetail from "@/components/teacher/ClassDetail";
import { toast } from "sonner";

interface TeacherClassesTabProps {
  teacherStatus: string | null;
}

const TeacherClassesTab = ({ teacherStatus }: TeacherClassesTabProps) => {
  const { data: classes = [] } = useTeacherClasses();
  const { data: referralCodes = [] } = useTeacherReferralCodes();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  if (selectedClass) {
    return (
      <ClassDetail
        classId={selectedClass.id}
        className={selectedClass.name}
        joinCode={selectedClass.join_code}
        onBack={() => setSelectedClassId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {teacherStatus === "unverified" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              🔒 Pentru acces la <strong>subiecte și teste predefinite</strong>, parcurge pașii de verificare din tab-ul Profil.
            </p>
          </CardContent>
        </Card>
      )}

      {teacherStatus === "pending" && (
        <Card className="border-warning/30">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Verificare în curs — vei fi notificat când este aprobată.</p>
          </CardContent>
        </Card>
      )}

      {teacherStatus === "verified" && referralCodes.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Coduri invitație pentru colegi
            </p>
            <div className="space-y-2">
              {referralCodes.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-mono font-bold text-foreground">{c.code}</span>
                    {c.used_by ? (
                      <span className="text-xs text-muted-foreground ml-2 inline-flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary" /> Folosit
                      </span>
                    ) : (
                      <span className="text-xs text-primary ml-2">Disponibil</span>
                    )}
                  </div>
                  {!c.used_by && (
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Cod copiat!"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ClassManager onSelectClass={setSelectedClassId} />
    </div>
  );
};

export default TeacherClassesTab;
