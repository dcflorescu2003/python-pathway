import { useState } from "react";
import TestManager from "@/components/teacher/TestManager";
import TestBuilder from "@/components/teacher/TestBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface TeacherTestsTabProps {
  teacherStatus: string | null;
}

const TeacherTestsTab = ({ teacherStatus }: TeacherTestsTabProps) => {
  const [showTestBuilder, setShowTestBuilder] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  if (showTestBuilder) {
    return (
      <TestBuilder
        onBack={() => { setShowTestBuilder(false); setEditingTestId(null); }}
        editTestId={editingTestId}
        teacherStatus={teacherStatus}
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

      <TestManager
        onCreateTest={() => { setEditingTestId(null); setShowTestBuilder(true); }}
        onEditTest={(testId) => { setEditingTestId(testId); setShowTestBuilder(true); }}
      />
    </div>
  );
};

export default TeacherTestsTab;
