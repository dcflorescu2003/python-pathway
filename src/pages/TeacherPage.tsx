import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useTeacherClasses } from "@/hooks/useTeacher";
import ClassManager from "@/components/teacher/ClassManager";
import ClassDetail from "@/components/teacher/ClassDetail";

const TeacherPage = () => {
  const navigate = useNavigate();
  const { data: classes = [] } = useTeacherClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Panou Profesor</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {selectedClass ? (
          <ClassDetail
            classId={selectedClass.id}
            className={selectedClass.name}
            joinCode={selectedClass.join_code}
            onBack={() => setSelectedClassId(null)}
          />
        ) : (
          <ClassManager onSelectClass={setSelectedClassId} />
        )}
      </main>
    </motion.div>
  );
};

export default TeacherPage;
