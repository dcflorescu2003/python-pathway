import { useState } from "react";
import TestManager from "@/components/teacher/TestManager";
import TestBuilder from "@/components/teacher/TestBuilder";

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
    <TestManager
      onCreateTest={() => { setEditingTestId(null); setShowTestBuilder(true); }}
      onEditTest={(testId) => { setEditingTestId(testId); setShowTestBuilder(true); }}
    />
  );
};

export default TeacherTestsTab;
