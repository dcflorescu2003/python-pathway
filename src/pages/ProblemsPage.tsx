import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { problems } from "@/data/problems";
import { useProgress } from "@/hooks/useProgress";

const difficultyConfig = {
  "ușor": { color: "bg-primary/20 text-primary border-primary/30", stars: 1 },
  "mediu": { color: "bg-warning/20 text-warning border-warning/30", stars: 2 },
  "greu": { color: "bg-destructive/20 text-destructive border-destructive/30", stars: 3 },
};

const ProblemsPage = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Code className="h-7 w-7 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Probleme</h1>
        </div>
        <p className="text-sm text-muted-foreground">Rezolvă probleme Python și câștigă XP</p>
      </div>

      <div className="px-4 space-y-3">
        {problems.map((problem, index) => {
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
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          {problem.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {problem.xpReward} XP
                        </span>
                        {problem.chapter && (
                          <span className="text-xs text-muted-foreground">
                            {problem.chapter}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProblemsPage;
