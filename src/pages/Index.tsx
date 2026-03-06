import { useNavigate } from "react-router-dom";
import { getLevelFromXP, getXPForNextLevel } from "@/data/courses";
import { getStoredChapters } from "@/hooks/useExerciseStore";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Flame, Heart, Zap, Trophy } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const chapters = getStoredChapters();
  const level = getLevelFromXP(progress.xp);
  const xpToNext = getXPForNextLevel(progress.xp);
  const xpInLevel = 100 - xpToNext;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - safe area aware */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold font-mono text-gradient-primary">🐍 PyLearn</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-warning">
              <Flame className="h-5 w-5" />
              <span className="text-sm font-bold">{progress.streak}</span>
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-bold">{progress.lives}</span>
            </div>
            <div className="flex items-center gap-1 text-xp">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-bold">{progress.xp}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-5 glow-primary"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Nivel {level}</p>
              <p className="text-lg font-bold text-foreground">Pythonist</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              🐍
            </div>
          </div>
          <Progress value={xpInLevel} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">{xpInLevel}/100 XP pentru nivelul {level + 1}</p>
        </motion.div>

        {/* Chapters */}
        <div className="space-y-3">
          {chapters.map((chapter, idx) => {
            const completedCount = chapter.lessons.filter(
              (l) => progress.completedLessons[l.id]?.completed
            ).length;
            const totalLessons = chapter.lessons.length;
            const isLocked = idx > 0 && (() => {
              const prevChapter = chapters[idx - 1];
              const prevCompleted = prevChapter.lessons.filter(
                (l) => progress.completedLessons[l.id]?.completed
              ).length;
              return prevCompleted < Math.ceil(prevChapter.lessons.length * 0.5);
            })();

            return (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                onClick={() => !isLocked && navigate(`/chapter/${chapter.id}`)}
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all active:scale-[0.98] ${
                  isLocked
                    ? "border-border/50 bg-card/50 opacity-50 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `hsl(${chapter.color} / 0.15)` }}
                  >
                    {chapter.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      Capitol {chapter.number}
                    </p>
                    <h2 className="text-sm font-bold text-foreground truncate">
                      {chapter.title}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress
                        value={(completedCount / totalLessons) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                        {completedCount}/{totalLessons}
                      </span>
                    </div>
                  </div>
                  {isLocked && <span className="text-lg">🔒</span>}
                  {completedCount === totalLessons && totalLessons > 0 && (
                    <Trophy className="h-5 w-5 text-warning" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Index;
