import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChapters } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Lock, Play, BookOpen, Crown, Zap, Trophy, ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import OfflineBanner from "@/components/states/OfflineBanner";
import PremiumDialog from "@/components/PremiumDialog";
import LoadingScreen from "@/components/states/LoadingScreen";
import SkipChallengeDialog from "@/components/SkipChallengeDialog";

const COOLDOWN_KEY_PREFIX = "pyro-skip-cooldown:";

const ChapterPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [showPremium, setShowPremium] = useState(false);
  const [skipDialog, setSkipDialog] = useState<{ lessonId: string; title: string; cooldownMs: number } | null>(null);
  const currentLessonRef = useRef<HTMLDivElement>(null);
  const { data: chapters, isLoading } = useChapters();

  const chapter = chapters?.find((c) => c.id === chapterId);

  useEffect(() => {
    if (currentLessonRef.current) {
      currentLessonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [chapterId]);

  if (isLoading || !chapters) return <LoadingScreen />;
  if (!chapter) return <div className="p-8 text-center text-foreground">Capitol negăsit</div>;

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Capitol {chapter.number}</p>
            <h1 className="text-lg font-bold text-foreground truncate">{chapter.title}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/chapter/${chapter.id}/theory`)} className="gap-1.5 touch-target">
            <BookOpen className="h-4 w-4" /> Teorie
          </Button>
        </div>
      </header>

      <main className="px-4 py-8">
        <div className="flex flex-col items-center">
          {chapter.lessons.map((lesson, idx) => {
            const isCompleted = progress.completedLessons[lesson.id]?.completed;
            const score = progress.completedLessons[lesson.id]?.score ?? 0;
            const previousDone = idx === 0 || progress.completedLessons[chapter.lessons[idx - 1].id]?.completed;
            const skipUnlocked = !!progress.skipUnlockedLessons?.[lesson.id];
            const isLocked = !previousDone && !skipUnlocked;
            const isCurrent = !isCompleted && !isLocked;
            const isPremiumLocked = false;
            const showSkipBadge = skipUnlocked && !isCompleted && !previousDone;

            const handleClick = () => {
              if (isPremiumLocked) { setShowPremium(true); return; }
              if (!isLocked) { navigate(`/lesson/${lesson.id}`); return; }
              // Locked → offer skip challenge
              let cooldownMs = 0;
              try {
                const stored = localStorage.getItem(`${COOLDOWN_KEY_PREFIX}${lesson.id}`);
                if (stored) cooldownMs = Math.max(0, parseInt(stored, 10) - Date.now());
              } catch {}
              setSkipDialog({ lessonId: lesson.id, title: lesson.title, cooldownMs });
            };

            return (
              <div key={lesson.id} className="flex flex-col items-center" ref={isCurrent ? currentLessonRef : undefined}>
                {idx > 0 && <div className={`h-8 w-0.5 ${isCompleted ? "bg-primary" : "bg-border"}`} />}
                {(() => {
                  const hueShift = idx * 30;
                  const lessonColor = `hsl(${parseInt(chapter.color) + hueShift}, 70%, 50%)`;
                  const lessonColorBg = `hsl(${parseInt(chapter.color) + hueShift}, 70%, 50%, 0.15)`;
                  const lessonColorBorder = `hsl(${parseInt(chapter.color) + hueShift}, 70%, 50%, 0.6)`;
                  return (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.06 }}
                      onClick={handleClick}
                      className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 transition-all active:scale-95 ${
                        isPremiumLocked ? "border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed" : ""
                      } ${isLocked && !isPremiumLocked ? "border-yellow-500/40 bg-card text-muted-foreground hover:border-yellow-500/70 hover:opacity-90 opacity-60 cursor-pointer" : ""} ${isCurrent && !isPremiumLocked ? "animate-pulse-glow" : ""}`}
                      style={!isLocked && !isPremiumLocked ? { borderColor: lessonColorBorder, backgroundColor: lessonColorBg, color: lessonColor } : undefined}
                    >
                      {isPremiumLocked ? <Crown className="h-6 w-6 text-yellow-500" /> : isCompleted ? <Check className="h-7 w-7" /> : isLocked ? <Lock className="h-6 w-6" /> : <Play className="h-7 w-7 ml-1" />}
                      {isLocked && !isPremiumLocked && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-black shadow-md">
                          <Zap className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </motion.button>
                  );
                })()}
                <div className="mt-2 mb-2 text-center max-w-[200px]">
                  <p className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                    {lesson.title}
                    {showSkipBadge && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-yellow-500">
                        <Zap className="h-2.5 w-2.5" /> Sărită
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                  {isCompleted && <p className="text-xs text-primary font-mono mt-0.5">★ {score}/{lesson.exercises.length}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <PremiumDialog open={showPremium} onOpenChange={setShowPremium} />
      {skipDialog && (
        <SkipChallengeDialog
          open={!!skipDialog}
          onOpenChange={(o) => { if (!o) setSkipDialog(null); }}
          lessonId={skipDialog.lessonId}
          lessonTitle={skipDialog.title}
          realLives={progress.lives}
          cooldownRemainingMs={skipDialog.cooldownMs}
        />
      )}
    </div>
  );
};

export default ChapterPage;
