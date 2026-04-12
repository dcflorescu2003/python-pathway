import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown, Sparkles, Target, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Chapter } from "@/hooks/useChapters";
import type { UserProgress } from "@/hooks/useProgress";

interface LessonStat {
  id: string;
  title: string;
  chapterTitle: string;
  chapterId: string;
  score: number;
}

interface Props {
  chapters: Chapter[];
  progress: UserProgress;
}

const PersonalizedSummary = ({ chapters, progress }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const { strengths, weaknesses, avgScore, totalCompleted } = useMemo(() => {
    const allStats: LessonStat[] = [];

    for (const chapter of chapters) {
      for (const lesson of chapter.lessons) {
        const completed = progress.completedLessons[lesson.id];
        if (completed?.completed) {
          allStats.push({
            id: lesson.id,
            title: lesson.title,
            chapterTitle: chapter.title,
            chapterId: chapter.id,
            score: completed.score,
          });
        }
      }
    }

    if (allStats.length === 0) {
      return { strengths: [], weaknesses: [], avgScore: 0, totalCompleted: 0 };
    }

    const sorted = [...allStats].sort((a, b) => a.score - b.score);
    const avg = Math.round(allStats.reduce((s, l) => s + l.score, 0) / allStats.length);

    // Weaknesses: score < 80, sorted ascending (worst first)
    const weak = sorted.filter((l) => l.score < 80).slice(0, 5);
    // Strengths: score >= 90, sorted descending (best first)
    const strong = sorted.filter((l) => l.score >= 90).reverse().slice(0, 5);

    return { strengths: strong, weaknesses: weak, avgScore: avg, totalCompleted: allStats.length };
  }, [chapters, progress]);

  if (totalCompleted < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-4"
    >
      <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-primary/5 overflow-hidden">
        <CardContent className="p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h3 className="text-sm font-bold text-foreground">Sumar personalizat</h3>
            <Badge variant="outline" className="ml-auto text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
              PRO
            </Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          {/* Quick stats always visible */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">{totalCompleted}</p>
              <p className="text-[10px] text-muted-foreground">lecții completate</p>
            </div>
            <div className="flex-1 text-center">
              <p className={`text-lg font-bold ${avgScore >= 80 ? "text-primary" : avgScore >= 60 ? "text-warning" : "text-destructive"}`}>
                {avgScore}%
              </p>
              <p className="text-[10px] text-muted-foreground">scor mediu</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-primary">{strengths.length}</p>
              <p className="text-[10px] text-muted-foreground">lecții excelente</p>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Needs practice */}
                {weaknesses.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-4 w-4 text-warning" />
                      <p className="text-xs font-bold text-foreground">Ai nevoie de exercițiu</p>
                    </div>
                    <div className="space-y-1.5">
                      {weaknesses.map((l) => (
                        <button
                          key={l.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lesson/${l.id}`);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg bg-card border border-border p-2.5 text-left hover:border-warning/50 transition-colors active:scale-[0.98]"
                        >
                          <TrendingDown className="h-4 w-4 text-warning shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{l.title}</p>
                            <p className="text-[10px] text-muted-foreground">{l.chapterTitle}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Progress value={l.score} className="h-1.5 w-12" />
                            <span className="text-[10px] font-mono text-warning">{l.score}%</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {strengths.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-xs font-bold text-foreground">Te descurci excelent</p>
                    </div>
                    <div className="space-y-1.5">
                      {strengths.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center gap-2 rounded-lg bg-card border border-border p-2.5"
                        >
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{l.title}</p>
                            <p className="text-[10px] text-muted-foreground">{l.chapterTitle}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Progress value={l.score} className="h-1.5 w-12" />
                            <span className="text-[10px] font-mono text-primary">{l.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {weaknesses.length === 0 && strengths.length > 0 && (
                  <p className="mt-3 text-xs text-primary text-center">🎉 Felicitări! Toate lecțiile tale au scor excelent!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalizedSummary;
