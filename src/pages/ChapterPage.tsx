import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChapters } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Lock, Play, BookOpen, Crown, Zap, Trophy, ArrowRight, Map, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import OfflineBanner from "@/components/states/OfflineBanner";
import PremiumDialog from "@/components/PremiumDialog";
import LoadingScreen from "@/components/states/LoadingScreen";
import SkipChallengeDialog from "@/components/SkipChallengeDialog";
import ConfettiCanvas from "@/components/ConfettiCanvas";

const COOLDOWN_KEY_PREFIX = "pyro-skip-cooldown:";
const CHAPTER_DONE_KEY_PREFIX = "pyro-chapter-done-celebrated:";

const ChapterPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user } = useAuth();
  const [showPremium, setShowPremium] = useState(false);
  const [skipDialog, setSkipDialog] = useState<{ lessonId: string; title: string; cooldownMs: number } | null>(null);
  const [lockedInfo, setLockedInfo] = useState<{ lessonId: string; title: string; previousTitle: string | null; cooldownMs: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const currentLessonRef = useRef<HTMLDivElement>(null);
  const { data: chapters, isLoading } = useChapters();

  const chapter = chapters?.find((c) => c.id === chapterId);

  const allDone = useMemo(
    () => !!chapter && chapter.lessons.length > 0 && chapter.lessons.every(l => progress.completedLessons[l.id]?.completed),
    [chapter, progress.completedLessons]
  );

  // Compute first uncompleted (and unlocked) lesson — focus target on chapter entry
  const firstUncompletedId = useMemo(() => {
    if (!chapter) return null;
    for (let i = 0; i < chapter.lessons.length; i++) {
      const l = chapter.lessons[i];
      const done = !!progress.completedLessons[l.id]?.completed;
      const prevDone = i === 0 || !!progress.completedLessons[chapter.lessons[i - 1].id]?.completed;
      const skipUnlocked = !!progress.skipUnlockedLessons?.[l.id];
      if (!done && (prevDone || skipUnlocked)) return l.id;
    }
    return null;
  }, [chapter, progress.completedLessons, progress.skipUnlockedLessons]);

  // Scroll to first uncompleted lesson once data is ready (re-runs if chapter changes)
  useEffect(() => {
    if (!firstUncompletedId) return;
    const t = window.setTimeout(() => {
      currentLessonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [chapterId, firstUncompletedId]);

  useEffect(() => {
    if (!allDone || !chapter) return;
    const userKey = user?.id ?? "guest";
    const key = `${CHAPTER_DONE_KEY_PREFIX}${userKey}:${chapter.id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {}
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(t);
  }, [allDone, chapter, user?.id]);

  if (isLoading || !chapters) return <LoadingScreen />;
  if (!chapter) return <div className="p-8 text-center text-foreground">Capitol negăsit</div>;

  return (
    <div className="min-h-screen bg-background">
      <ConfettiCanvas active={showConfetti} />
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
              // Locked → show confirmation with explanation; user can choose to try skip challenge
              let cooldownMs = 0;
              try {
                const stored = localStorage.getItem(`${COOLDOWN_KEY_PREFIX}${lesson.id}`);
                if (stored) cooldownMs = Math.max(0, parseInt(stored, 10) - Date.now());
              } catch {}
              const previousTitle = idx > 0 ? chapter.lessons[idx - 1].title : null;
              setLockedInfo({ lessonId: lesson.id, title: lesson.title, previousTitle, cooldownMs });
            };

            return (
              <div key={lesson.id} className="flex flex-col items-center" ref={isCurrent ? currentLessonRef : undefined}>
                {idx > 0 && <div className={`h-8 w-0.5 ${isCompleted ? "bg-primary/40" : "bg-border"}`} />}
                {(() => {
                  const hueShift = idx * 30;
                  const baseHue = parseInt(chapter.color) + hueShift;
                  const sat = isCompleted ? 35 : 70;
                  const lightness = isCompleted ? 45 : 50;
                  const lessonColor = `hsl(${baseHue}, ${sat}%, ${lightness}%)`;
                  const lessonColorBg = `hsl(${baseHue}, ${sat}%, ${lightness}%, ${isCompleted ? 0.08 : 0.18})`;
                  const lessonColorBorder = `hsl(${baseHue}, ${sat}%, ${lightness}%, ${isCompleted ? 0.35 : 0.7})`;
                  const sizeClass = isCurrent && !isPremiumLocked ? "h-20 w-20" : "h-[72px] w-[72px]";
                  const completedFade = isCompleted ? "opacity-60" : "";
                  const currentGlow = isCurrent && !isPremiumLocked
                    ? { boxShadow: `0 0 28px ${lessonColor}, 0 0 12px ${lessonColor}` }
                    : {};
                  return (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.06 }}
                      onClick={handleClick}
                      className={`relative flex ${sizeClass} items-center justify-center rounded-full border-4 transition-all active:scale-95 ${
                        isPremiumLocked ? "border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed" : ""
                      } ${isLocked && !isPremiumLocked ? "border-yellow-500/40 bg-card text-muted-foreground hover:border-yellow-500/70 hover:opacity-90 opacity-60 cursor-pointer" : ""} ${isCurrent && !isPremiumLocked ? "animate-pulse-glow" : ""} ${completedFade}`}
                      style={!isLocked && !isPremiumLocked ? { borderColor: lessonColorBorder, backgroundColor: lessonColorBg, color: lessonColor, ...currentGlow } : undefined}
                    >
                      {isPremiumLocked ? <Crown className="h-6 w-6 text-yellow-500" /> : isCompleted ? <Check className="h-7 w-7" /> : isLocked ? <Lock className="h-6 w-6" /> : <Play className={`${isCurrent ? "h-8 w-8" : "h-7 w-7"} ml-1`} />}
                      {isLocked && !isPremiumLocked && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-black shadow-md">
                          <Zap className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </motion.button>
                  );
                })()}
                <div className="mt-2 mb-2 text-center max-w-[200px]">
                  <p className={`text-base font-bold flex items-center justify-center gap-1 ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                    {lesson.title}
                    {showSkipBadge && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-yellow-500">
                        <Zap className="h-2.5 w-2.5" /> Sărită
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                  {isCompleted && (
                    <p className="text-xs text-primary font-mono mt-0.5">
                      {score === 100 ? <>🏆 100%</> : <>★ {score}%</>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {(() => {
            const allDone = chapter.lessons.length > 0 && chapter.lessons.every(l => progress.completedLessons[l.id]?.completed);
            if (!allDone) return null;
            const sorted = [...chapters].sort((a, b) => a.number - b.number);
            const nextChapter = sorted.find(c => c.number > chapter.number);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mt-10 w-full max-w-md rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center shadow-[0_0_32px_hsl(var(--primary)/0.2)]"
              >
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 border-2 border-primary/40">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">Capitol terminat! 🎉</h2>
                {nextChapter ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Felicitări! Ai parcurs cu succes toate lecțiile. Continuă aventura cu <span className="font-semibold text-foreground">{nextChapter.title}</span>!
                    </p>
                    <Button onClick={() => navigate(`/chapter/${nextChapter.id}`)} className="w-full gap-2 touch-target">
                      Mergi la capitolul următor <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Incredibil! Ai terminat toată programa. Ești un adevărat <span className="font-semibold text-foreground">Master of Python</span>! 🐍
                    </p>
                    <Button onClick={() => navigate("/")} variant="outline" className="w-full gap-2 touch-target">
                      <Map className="h-4 w-4" /> Înapoi la harta
                    </Button>
                  </>
                )}
              </motion.div>
            );
          })()}
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
