import { useState } from "react";
import CompetencyProfileCard, { type CompetencyMode } from "@/components/account/CompetencyProfileCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentCompetencyViewProps {
  studentId: string;
  studentName?: string;
}

const MODE_LABELS: Record<CompetencyMode, string> = {
  tests_only: "Doar teste",
  blended: "Mediu (60/40)",
  self_only: "Auto-învățare",
};

const MODE_SUBTITLES: Record<CompetencyMode, string> = {
  tests_only: "Bazat exclusiv pe testele tale",
  blended: "60% teste · 40% auto-învățare",
  self_only: "Doar lecții & probleme rezolvate singur",
};

const StudentCompetencyView = ({ studentId, studentName }: StudentCompetencyViewProps) => {
  const [mode, setMode] = useState<CompetencyMode>("tests_only");

  return (
    <div className="space-y-2">
      <Tabs value={mode} onValueChange={(v) => setMode(v as CompetencyMode)}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="tests_only" className="text-[11px]">
            {MODE_LABELS.tests_only}
          </TabsTrigger>
          <TabsTrigger value="blended" className="text-[11px]">
            {MODE_LABELS.blended}
          </TabsTrigger>
          <TabsTrigger value="self_only" className="text-[11px]">
            {MODE_LABELS.self_only}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <CompetencyProfileCard
        studentId={studentId}
        mode={mode}
        title={studentName ? `Competențe · ${studentName}` : "Profil de competențe"}
        subtitle={MODE_SUBTITLES[mode]}
        defaultExpanded
      />
    </div>
  );
};

export default StudentCompetencyView;
