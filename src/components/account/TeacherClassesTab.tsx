import { useState } from "react";
import { useTeacherClasses } from "@/hooks/useTeacher";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import ClassManager from "@/components/teacher/ClassManager";
import ClassDetail from "@/components/teacher/ClassDetail";

interface TeacherClassesTabProps {
  teacherStatus: string | null;
}

const TeacherClassesTab = ({ teacherStatus }: TeacherClassesTabProps) => {
  const { data: classes = [] } = useTeacherClasses();
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



      <ClassManager onSelectClass={setSelectedClassId} />
    </div>
  );
};

export default TeacherClassesTab;
