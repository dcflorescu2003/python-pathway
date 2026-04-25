import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChapters } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Lock, Play, BookOpen, Crown, Zap, Trophy, ArrowRight, Map, Info, Sparkles, Hammer } from "lucide-react";
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

type LessonSection = "start" | "build" | "master";

const getSectionBoundaries = (total: number) => {
  const startEnd = Math.ceil(total / 3);
  const buildEnd = startEnd + Math.ceil((total - startEnd) / 2);
  return { startEnd, buildEnd };
};

const SECTION_META: Record<LessonSection, { label: string; subtitle: string; Icon: typeof Sparkles; colorClass: string; glowClass: string; borderClass: string }> = {
  start: {
    label: "Start",
    subtitle: "Primii pași în capitol",
    Icon: Sparkles,
    colorClass: "text-primary",
    glowClass: "bg-primary/15",
    borderClass: "border-primary/40",
  },
  build: {
    label: "Build",
    subtitle: "Construim pe ce am învățat",
    Icon: Hammer,
    colorClass: "text-accent",
    glowClass: "bg-accent/15",
    borderClass: "border-accent/40",
  },
  master: {
    label: "Master",
    subtitle: "Provocarea finală",
    Icon: Crown,
    colorClass: "text-yellow-500",
    glowClass: "bg-yellow-500/15",
    borderClass: "border-yellow-500/40",
  },
};

const SectionDivider = ({ section, isFirst }: { section: LessonSection; isFirst: boolean }) => {
  const meta = SECTION_META[section];
  const Icon = meta.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`w-full max-w-md ${isFirst ? "mt-2 mb-3" : "mt-10 mb-3"}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${meta.borderClass} ${meta.glowClass}`}>
          <Icon className={`h-5 w-5 ${meta.colorClass}`} />
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>
      <div className="mt-2 text-center">
        <p className={`text-xs font-mono uppercase tracking-[0.25em] font-bold ${meta.colorClass}`}>
          {meta.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
      </div>
    </motion.div>
  );
};

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
  const chapterIdx = chapters?.findIndex((c) => c.id === chapterId) ?? -1;

  // Capitolul este blocat dacă elevul nu a terminat ≥50% din capitolul anterior (excluzând „Practică:")
  const chapterLock = useMemo(() => {
    if (!chapters || chapterIdx <= 0) return null;
    const prev = chapters[chapterIdx - 1];
    const prevNonPractice = prev.lessons.filter((l) => !l.title.startsWith("Practică:"));
    if (prevNonPractice.length === 0) return null;
    const prevCompleted = prevNonPractice.filter((l) => progress.completedLessons[l.id]?.completed).length;
    const required = Math.ceil(prevNonPractice.length * 0.5);
    if (prevCompleted >= required) return null;
    return { prevTitle: prev.title, prevCompleted, required, total: prevNonPractice.length };
  }, [chapters, chapterIdx, progress.completedLessons]);

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

  // Cazul special: capitolul în sine este blocat (utilizatorul a ajuns aici prin deep-link / istoric)
  if (chapterLock) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
          </div>
        </header>
        <main className="flex-1 px-4 py-10 flex items-start justify-center">
          <div className="w-full max-w-md rounded-2xl border-2 border-yellow-500/40 bg-card p-6 text-center shadow-[0_0_28px_hsl(48_100%_50%/0.15)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/15 border-2 border-yellow-500/40">
              <Lock className="h-7 w-7 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Capitol blocat</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pentru a începe <span className="font-semibold text-foreground">„{chapter.title}"</span>, trebuie să termini mai întâi cel puțin{" "}
              <span className="font-semibold text-foreground">{chapterLock.required} din {chapterLock.total}</span> lecții din capitolul anterior:{" "}
              <span className="font-semibold text-foreground">„{chapterLock.prevTitle}"</span>.
            </p>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm mb-4">
              <p className="flex items-center justify-center gap-2 text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Progres curent: <span className="font-mono font-semibold">{chapterLock.prevCompleted}/{chapterLock.required}</span>
              </p>
            </div>
            <Button onClick={() => navigate(`/chapter/${chapters[chapterIdx - 1].id}`)} className="w-full gap-2 touch-target">
              <ArrowLeft className="h-4 w-4" /> Mergi la capitolul anterior
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full mt-2 touch-target">
              Înapoi la harta
            </Button>
          </div>
        </main>
      </div>
    );
  }

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
              <div key={lesson.id} className="flex flex-col items-center" ref={lesson.id === firstUncompletedId ? currentLessonRef : undefined}>
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
      <AlertDialog open={!!lockedInfo} onOpenChange={(o) => { if (!o) setLockedInfo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-500" />
              Lecție blocată
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  Lecția <span className="font-semibold text-foreground">„{lockedInfo?.title}"</span> nu este încă disponibilă.
                </p>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-foreground mb-1">
                    <Info className="h-4 w-4 text-primary" />
                    Cum o deblochezi?
                  </p>
                  {lockedInfo?.previousTitle ? (
                    <p>
                      Termină mai întâi lecția anterioară: <span className="font-semibold text-foreground">„{lockedInfo.previousTitle}"</span>.
                    </p>
                  ) : (
                    <p>Termină lecția anterioară pentru a continua.</p>
                  )}
                  <p className="mt-2 text-muted-foreground">
                    Alternativ, poți încerca o <span className="font-medium text-yellow-500">provocare de skip</span> — răspunzi corect la câteva întrebări și deblochezi lecția fără să o parcurgi pe cea anterioară.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Înțeles</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!lockedInfo) return;
                const info = lockedInfo;
                setLockedInfo(null);
                setSkipDialog({ lessonId: info.lessonId, title: info.title, cooldownMs: info.cooldownMs });
              }}
              className="gap-1.5"
            >
              <Zap className="h-4 w-4" /> Încearcă skip challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChapterPage;
