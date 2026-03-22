import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, ChevronRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { problems, problemChapters } from "@/data/problems";
import { useProgress } from "@/hooks/useProgress";

const difficultyConfig = {
  "ușor": { color: "bg-primary/20 text-primary border-primary/30" },
  "mediu": { color: "bg-warning/20 text-warning border-warning/30" },
  "greu": { color: "bg-destructive/20 text-destructive border-destructive/30" },
};

const ProblemsPage = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const chapterProblems = selectedChapter
    ? problems.filter((p) => p.chapter === selectedChapter)
    : [];

  const selectedChapterData = problemChapters.find((c) => c.id === selectedChapter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          {selectedChapter ? (
            <button onClick={() => setSelectedChapter(null)} className="active:scale-90 transition-transform">
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>
          ) : (
            <Code className="h-7 w-7 text-accent" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedChapter ? selectedChapterData?.title : "Probleme"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedChapter ? "Alege o problemă de rezolvat" : "Rezolvă probleme Python și câștigă XP"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {!selectedChapter ? (
          // Chapter list
          problemChapters.map((chapter, index) => {
            const chProblems = problems.filter((p) => p.chapter === chapter.id);
            const solvedCount = chProblems.filter(
              (p) => progress.completedLessons[`problem-${p.id}`]?.completed
            ).length;

            return (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer active:scale-[0.98] transition-transform border-border hover:border-primary/30"
                  onClick={() => setSelectedChapter(chapter.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{chapter.icon}</span>
                        <div>
                          <span className="font-semibold text-foreground">{chapter.title}</span>
                          <p className="text-xs text-muted-foreground">
                            {solvedCount}/{chProblems.length} rezolvate
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          // Problem list for selected chapter
          chapterProblems.map((problem, index) => {
            const config = difficultyConfig[problem.difficulty];
            const solved = progress.completedLessons[`problem-${problem.id}`]?.completed;

            return (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer active:scale-[0.98] transition-transform border-border hover:border-primary/30"
                  onClick={() => navigate(`/problem/${problem.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">
                            {problem.title}
                          </span>
                          {solved && (
                            <span className="text-xs text-primary font-bold">✓</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                            {problem.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {problem.xpReward} XP
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default ProblemsPage;
