import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeacherClasses } from "@/hooks/useTeacher";
import ClassManager from "@/components/teacher/ClassManager";
import ClassDetail from "@/components/teacher/ClassDetail";
import TestManager from "@/components/teacher/TestManager";
import TestBuilder from "@/components/teacher/TestBuilder";

const TeacherPage = () => {
  const navigate = useNavigate();
  const { data: classes = [] } = useTeacherClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showTestBuilder, setShowTestBuilder] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleEditTest = (testId: string) => {
    setEditingTestId(testId);
    setShowTestBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowTestBuilder(false);
    setEditingTestId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Panou Profesor</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {showTestBuilder ? (
          <TestBuilder onBack={handleCloseBuilder} editTestId={editingTestId} />
        ) : selectedClass ? (
          <ClassDetail
            classId={selectedClass.id}
            className={selectedClass.name}
            joinCode={selectedClass.join_code}
            onBack={() => setSelectedClassId(null)}
          />
        ) : (
          <Tabs defaultValue="classes" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="classes" className="flex-1">Clase</TabsTrigger>
              <TabsTrigger value="tests" className="flex-1">Teste</TabsTrigger>
            </TabsList>
            <TabsContent value="classes" className="mt-4">
              <ClassManager onSelectClass={setSelectedClassId} />
            </TabsContent>
            <TabsContent value="tests" className="mt-4">
              <TestManager
                onCreateTest={() => { setEditingTestId(null); setShowTestBuilder(true); }}
                onEditTest={handleEditTest}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </motion.div>
  );
};

export default TeacherPage;
