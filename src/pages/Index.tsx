import { useNavigate } from "react-router-dom";
import { getLevelFromXP, getXPForNextLevel } from "@/data/courses";
import { getStoredChapters } from "@/hooks/useExerciseStore";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Flame, Heart, Zap, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const chapters = getStoredChapters();
  const level = getLevelFromXP(progress.xp);
  const xpToNext = getXPForNextLevel(progress.xp);
  const xpInLevel = 100 - xpToNext;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold font-mono text-gradient-primary">🐍 PyLearn</h1>
          <div className="flex items-center gap-4">
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
              <span className="text-sm font-bold">{progress.xp} XP</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/leaderboard")}
              className="text-warning hover:text-warning/80"
            >
              <Trophy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-border bg-card p-6 glow-primary"
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

        {/* Admin link */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate("/admin")}
        >
          <Settings className="h-4 w-4 mr-2" /> Editor Întrebări
        </Button>

        {/* Chapters */}
        <div className="space-y-4">
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
                transition={{ delay: idx * 0.08 }}
                onClick={() => !isLocked && navigate(`/chapter/${chapter.id}`)}
                className={`group relative overflow-hidden rounded-xl border p-5 transition-all cursor-pointer ${
                  isLocked
                    ? "border-border/50 bg-card/50 opacity-50 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/50 hover:glow-primary"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `hsl(${chapter.color} / 0.15)` }}
                  >
                    {chapter.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground mb-0.5">
                      Capitol {chapter.number}
                    </p>
                    <h2 className="text-base font-bold text-foreground truncate">
                      {chapter.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {chapter.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress
                        value={(completedCount / totalLessons) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {completedCount}/{totalLessons}
                      </span>
                    </div>
                  </div>
                  {isLocked && (
                    <span className="text-xl">🔒</span>
                  )}
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
