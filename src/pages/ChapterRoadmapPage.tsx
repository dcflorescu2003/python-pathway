import { useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Lock, Play, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChapters } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import LoadingScreen from "@/components/states/LoadingScreen";
const MotionButton = motion.button;

const ChapterRoadmapPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { data: chapters, isLoading } = useChapters();
  const { progress } = useProgress();
  const nextLessonRef = useRef<HTMLDivElement>(null);

  const chapter = chapters?.find((c) => c.id === chapterId);

  const { nextLessonId, completedCount, totalCount } = useMemo(() => {
    if (!chapter) return { nextLessonId: null as string | null, completedCount: 0, totalCount: 0 };
    const total = chapter.lessons.length;
    let completed = 0;
    let next: string | null = null;
    for (let i = 0; i < chapter.lessons.length; i++) {
      const l = chapter.lessons[i];
      const isDone = !!progress.completedLessons[l.id]?.completed;
      if (isDone) completed++;
      if (!next && !isDone) {
        const prevDone = i === 0 || !!progress.completedLessons[chapter.lessons[i - 1].id]?.completed;
        const skipUnlocked = !!progress.skipUnlockedLessons?.[l.id];
        if (prevDone || skipUnlocked) next = l.id;
      }
    }
    return { nextLessonId: next, completedCount: completed, totalCount: total };
  }, [chapter, progress.completedLessons, progress.skipUnlockedLessons]);

  useEffect(() => {
    if (nextLessonRef.current) {
      nextLessonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [nextLessonId]);

  if (isLoading || !chapters) return <LoadingScreen />;
  if (!chapter) return <div className="p-8 text-center text-foreground">Capitol negăsit</div>;

  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate(`/chapter/${chapter.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Roadmap · Capitol {chapter.number}</p>
            <h1 className="text-lg font-bold text-foreground truncate">{chapter.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono">{completedCount}/{totalCount}</p>
            <p className="text-[10px] font-mono text-primary">{progressPct}%</p>
          </div>
        </div>
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-8 pb-32">
        <div className="mx-auto w-full max-w-md">
          <div className="relative">
            {/* central spine */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border/60" />
            <ol className="space-y-6 relative">
              {chapter.lessons.map((lesson, idx) => {
                const isCompleted = !!progress.completedLessons[lesson.id]?.completed;
                const score = progress.completedLessons[lesson.id]?.score ?? 0;
                const previousDone = idx === 0 || !!progress.completedLessons[chapter.lessons[idx - 1].id]?.completed;
                const skipUnlocked = !!progress.skipUnlockedLessons?.[lesson.id];
                const isLocked = !previousDone && !skipUnlocked;
                const isNext = lesson.id === nextLessonId;
                const side = idx % 2 === 0 ? "left" : "right";

                return (
                  <li key={lesson.id} className="relative">
                    <div className={`flex items-center gap-3 ${side === "right" ? "flex-row-reverse" : ""}`}>
                      <div className="flex-1">
                        <motion.button
                          initial={{ opacity: 0, x: side === "left" ? -16 : 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => { if (!isLocked) navigate(`/lesson/${lesson.id}`); }}
                          disabled={isLocked}
                          ref={isNext ? nextLessonRef : undefined}
                          className={`w-full text-${side === "left" ? "right" : "left"} rounded-2xl border-2 p-3 transition-all active:scale-[0.98] ${
                            isCompleted
                              ? "border-primary/30 bg-primary/5 opacity-80"
                              : isNext
                              ? "border-primary bg-primary/10 shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                              : isLocked
                              ? "border-border bg-card opacity-60 cursor-not-allowed"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                            Lecția {idx + 1}
                          </p>
                          <p className={`text-sm font-bold ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{lesson.description}</p>
                          {isCompleted && (
                            <p className="text-[11px] text-primary font-mono mt-1">
                              {score === 100 ? "🏆 100%" : `★ ${score}%`}
                            </p>
                          )}
                          {isNext && (
                            <p className="text-[11px] text-primary font-mono mt-1">▶ Continuă aici</p>
                          )}
                          {skipUnlocked && !isCompleted && !previousDone && (
                            <p className="text-[11px] text-yellow-500 font-mono mt-1 inline-flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Sărită
                            </p>
                          )}
                        </motion.button>
                      </div>

                      {/* node */}
                      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 bg-background"
                        style={{
                          borderColor: isCompleted
                            ? "hsl(var(--primary) / 0.5)"
                            : isNext
                            ? "hsl(var(--primary))"
                            : isLocked
                            ? "hsl(var(--border))"
                            : "hsl(var(--primary) / 0.6)",
                          color: isCompleted
                            ? "hsl(var(--primary))"
                            : isNext
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted-foreground))",
                          boxShadow: isNext ? "0 0 18px hsl(var(--primary) / 0.6)" : undefined,
                        }}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </div>

                      <div className="flex-1" aria-hidden />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center shadow-[0_0_32px_hsl(var(--primary)/0.2)]"
            >
              <Trophy className="mx-auto mb-2 h-10 w-10 text-primary" />
              <h2 className="text-lg font-bold text-foreground mb-1">Capitol terminat! 🎉</h2>
              <p className="text-sm text-muted-foreground">Felicitări — ai parcurs toate lecțiile din acest capitol.</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Sticky CTA */}
      {!allDone && (
        <div className="sticky bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <Button
            className="w-full gap-2 touch-target"
            onClick={() => nextLessonId && navigate(`/lesson/${nextLessonId}`)}
            disabled={!nextLessonId}
          >
            {nextLessonId ? "Continuă lecția următoare" : "Nicio lecție disponibilă"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChapterRoadmapPage;
