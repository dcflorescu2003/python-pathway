import { useState, useEffect, useRef } from "react";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { useXPThresholds, getLevelFromXP, getXPForNextLevel } from "@/hooks/useXPThresholds";
import { getLevelInfo } from "@/data/levels";
import { useProgress } from "@/hooks/useProgress";
import { useChallenges } from "@/hooks/useChallenges";
import { schools, getSelectedSchool, setSelectedSchool, clearSelectedSchool } from "@/data/schools";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Heart, Zap, Trophy, Crown, School, ChevronDown, Plus, Target, BookOpen, Code } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PremiumDialog from "@/components/PremiumDialog";
import LevelRoadmap from "@/components/LevelRoadmap";
import SchoolOnboarding from "@/components/onboarding/SchoolOnboarding";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscription } from "@/hooks/useSubscription";
import CouponExpiredDialog from "@/components/CouponExpiredDialog";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import LoadingScreen from "@/components/states/LoadingScreen";
import LevelUpDialog from "@/components/LevelUpDialog";
import StreakDialog from "@/components/StreakDialog";
import { Capacitor } from "@capacitor/core";

const Index = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { progress } = useProgress();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { challenges, isChallenge } = useChallenges();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [selectedSchool, setSchool] = useState(getSelectedSchool());
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [showPremium, setShowPremium] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const { isInstalled, canPrompt, promptInstall } = useInstallPrompt();
  const { couponExpired, dismissCouponExpired, startCheckout } = useSubscription();
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [bestStreak, setBestStreak] = useState(0);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Wait a beat for auth state to settle after OAuth redirects
      const timeout = setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [authLoading, user, navigate]);

  // Fetch best_streak from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("best_streak")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.best_streak != null) setBestStreak(data.best_streak);
      });
  }, [user]);

  useEffect(() => {
    if (!isInstalled || !user) return;
    const alreadyGranted = localStorage.getItem("pyro-install-premium-granted");
    if (alreadyGranted === user.id) return;

    const grantInstallPremium = async () => {
      try {
        const { data: existing } = await supabase
          .from("coupon_redemptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("coupon_id", "42b385ff-eb24-4604-8e36-595e9424387b")
          .limit(1);

        if (existing && existing.length > 0) {
          localStorage.setItem("pyro-install-premium-granted", user.id);
          return;
        }

        await supabase.from("coupon_redemptions").insert({
          user_id: user.id,
          coupon_id: "42b385ff-eb24-4604-8e36-595e9424387b",
          premium_until: "2026-08-31T23:59:59Z",
        });

        await supabase.from("profiles").update({ is_premium: true }).eq("user_id", user.id);

        localStorage.setItem("pyro-install-premium-granted", user.id);
        toast({
          title: "Premium activat! 🎉",
          description: "Ai Premium gratuit până pe 31 august 2026!",
        });
      } catch (err) {
        console.error("Failed to grant install premium:", err);
      }
    };

    grantInstallPremium();
  }, [isInstalled, user]);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user.id)
        .single();
      if (data?.school_id && data.school_id !== "skipped") {
        setSelectedSchool(data.school_id);
        setSchool(data.school_id);
      }
      setNeedsOnboarding(!data?.school_id);
    };
    checkOnboarding();
  }, [user]);

  const { xpPerLevel } = useXPThresholds();
  const level = getLevelFromXP(progress.xp, xpPerLevel);
  const xpToNext = getXPForNextLevel(progress.xp, xpPerLevel);
  const xpInLevel = Math.round(xpPerLevel) - xpToNext;
  const levelInfo = getLevelInfo(level);
  // Show premium popup after login for non-premium users (once per session)
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  useEffect(() => {
    if (!user || progress.isPremium || authLoading) return;
    const shown = sessionStorage.getItem("pyro-premium-popup-shown");
    if (!shown) {
      const timer = setTimeout(() => {
        setShowPremiumPopup(true);
        sessionStorage.setItem("pyro-premium-popup-shown", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, progress.isPremium, authLoading]);

  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setShowLevelUp(true);
    }
    prevLevelRef.current = level;
  }, [level]);

  if (needsOnboarding === true) {
    return <SchoolOnboarding onComplete={() => {
      setNeedsOnboarding(false);
      setSchool(getSelectedSchool());
    }} />;
  }

  const isReady = !chaptersLoading && !!chapters;

  const filteredSchools = schoolSearch.trim()
    ? schools.filter((s) =>
        `${s.name} ${s.city}`.toLowerCase().includes(schoolSearch.toLowerCase())
      ).slice(0, 50)
    : schools.slice(0, 50);

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchool(schoolId);
    setSchool(schoolId);
    setShowSchoolPicker(false);
  };

  const handleAddSchool = () => {
    if (!newSchoolName.trim()) return;
    toast({
      title: "Cerere trimisă! 📬",
      description: `Liceul "${newSchoolName}" va fi adăugat după aprobare.`,
    });
    setNewSchoolName("");
    setShowAddSchool(false);
  };

  const handleRemoveSchool = () => {
    clearSelectedSchool();
    setSchool(null);
    setShowSchoolPicker(false);
  };

  const currentSchool = schools.find((s) => s.id === selectedSchool);

  return (
    <AnimatePresence mode="wait">
      {!isReady ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoadingScreen />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="min-h-screen bg-background"
        >
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md pt-[env(safe-area-inset-top)] ${
        progress.isPremium 
          ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-background/90 to-yellow-500/10" 
          : "border-border bg-background/80"
      }`}>
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold font-mono">
            <img src={logo} alt="PyRo" className="inline h-7 w-7 rounded-md mr-1" />{" "}
            <span className="text-gradient-primary">Py</span>
            <span className="text-tricolor">Ro</span>
            {progress.isPremium && <span className="ml-1 text-xs text-yellow-500 font-bold">PRO</span>}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {!progress.isPremium && (
              <button onClick={() => setShowPremium(true)} className="text-yellow-500 active:scale-95 transition-transform">
                <Crown className="h-5 w-5" />
              </button>
            )}
            <button onClick={() => setShowStreak(true)} className="flex items-center gap-1 text-warning relative">
              <motion.div
                animate={progress.streak > 0 ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, 0],
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Flame className={`h-5 w-5 ${progress.streak > 0 ? "text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]" : "text-muted-foreground"}`} />
              </motion.div>
              {progress.streak > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              <span className={`text-sm font-bold ${progress.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}>{progress.streak}</span>
            </button>
            <div className="flex items-center gap-1 text-destructive">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-bold">{progress.isPremium ? "∞" : progress.lives}</span>
            </div>
            <div className="flex items-center gap-1 text-xp">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-bold">{progress.xp}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <button
            onClick={() => setShowSchoolPicker(!showSchoolPicker)}
            className="w-full flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-left active:scale-[0.98] transition-all"
          >
            <School className="h-5 w-5 text-primary shrink-0" />
            <span className="flex-1 text-sm text-foreground font-medium truncate">
              {currentSchool ? `${currentSchool.name}` : "Alege liceul tău"}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showSchoolPicker ? "rotate-180" : ""}`} />
          </button>

          {showSchoolPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-2 border-b border-border">
                <Input placeholder="Caută liceu sau oraș..." value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} className="h-9 text-sm" autoFocus />
              </div>
              {filteredSchools.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {filteredSchools.map((school) => (
                    <button key={school.id} onClick={() => handleSelectSchool(school.id)}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-0 transition-colors ${
                        selectedSchool === school.id ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary"
                      }`}>
                      {school.name} <span className="text-foreground/50">— {school.city}</span>
                    </button>
                  ))}
                  {!schoolSearch.trim() && schools.length > 50 && (
                    <p className="px-4 py-2 text-xs text-muted-foreground text-center">Caută pentru a vedea mai multe...</p>
                  )}
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-foreground/50">Niciun liceu găsit.</p>
              )}
              {selectedSchool && (
                <button onClick={handleRemoveSchool} className="w-full text-left px-4 py-3 text-sm text-destructive border-t border-border">Elimină selecția</button>
              )}
              {!showAddSchool ? (
                <button onClick={() => setShowAddSchool(true)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary border-t border-border">
                  <Plus className="h-4 w-4" /> Adaugă liceul tău
                </button>
              ) : (
                <div className="p-3 border-t border-border space-y-2">
                  <Input placeholder="Numele liceului..." value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} className="text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddSchool(false)} className="flex-1">Anulează</Button>
                    <Button size="sm" onClick={handleAddSchool} disabled={!newSchoolName.trim()} className="flex-1">Trimite cererea</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => setShowRoadmap(true)}
          className="mb-6 rounded-xl border border-border bg-card p-5 glow-primary cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Nivel {level}</p>
              <p className="text-lg font-bold text-foreground">
                {levelInfo.name} {progress.isPremium && <span className="text-yellow-500">👑</span>}
              </p>
            </div>
            <img src={levelInfo.image} alt={levelInfo.name}
              className="rounded-full object-cover"
              style={{ width: `${Math.round(48 * levelInfo.scale)}px`, height: `${Math.round(48 * levelInfo.scale)}px` }} />
          </div>
          <button onClick={() => setShowRoadmap(true)} className="w-full text-left active:scale-[0.98] transition-transform">
            <Progress value={(xpInLevel / Math.round(xpPerLevel)) * 100} className="h-2 cursor-pointer" />
            <p className="mt-1 text-xs text-muted-foreground">{xpInLevel}/{Math.round(xpPerLevel)} XP pentru nivelul {level + 1} · <span className="text-primary">Drumul spre Master of Python →</span></p>
          </button>
        </motion.div>

        {/* Active challenges */}
        {challenges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <button
                  onClick={() => setShowChallenges(!showChallenges)}
                  className="w-full flex items-center gap-2"
                >
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Vezi provocări ({challenges.filter(c => !progress.completedLessons[c.item_id]?.completed).length})</h3>
                  <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+10% XP</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showChallenges ? "rotate-180" : ""}`} />
                </button>
                {showChallenges && (
                  <div className="space-y-2 mt-3">
                    {challenges
                      .filter((c) => !progress.completedLessons[c.item_id]?.completed)
                      .slice(0, 5)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() =>
                            c.item_type === "lesson"
                              ? navigate(`/lesson/${c.item_id}`)
                              : navigate(`/problem/${c.item_id}`)
                          }
                          className="w-full flex items-center gap-2 rounded-lg bg-card border border-border p-2.5 text-left hover:border-primary/50 transition-colors"
                        >
                          {c.item_type === "lesson" ? (
                            <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Code className="h-4 w-4 text-accent-foreground shrink-0" />
                          )}
                          <span className="text-sm text-foreground truncate flex-1">{c.item_title}</span>
                          <span className="text-[10px] text-muted-foreground">{c.class_name}</span>
                        </button>
                      ))}
                    {challenges.filter((c) => !progress.completedLessons[c.item_id]?.completed).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-1">✅ Toate provocările completate!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-3">
          {chapters.map((chapter, idx) => {
            const completedCount = chapter.lessons.filter((l) => progress.completedLessons[l.id]?.completed).length;
            const totalLessons = chapter.lessons.length;
            
            const isLocked = idx > 0 && (() => {
              const prevChapter = chapters[idx - 1];
              const prevNonPractice = prevChapter.lessons.filter((l) => !l.title.startsWith("Practică:"));
              const prevCompleted = prevNonPractice.filter((l) => progress.completedLessons[l.id]?.completed).length;
              return prevCompleted < Math.ceil(prevNonPractice.length * 0.5);
            })();

            return (
              <motion.div key={chapter.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                onClick={() => !isLocked && navigate(`/chapter/${chapter.id}`)}
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all active:scale-[0.98] ${
                  isLocked ? "border-border/50 bg-card/50 opacity-50 cursor-not-allowed" : "border-border bg-card hover:border-primary/50 cursor-pointer"
                }`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `hsl(${chapter.color} / 0.15)` }}>
                    {chapter.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Capitol {chapter.number}</p>
                    <h2 className="text-base font-bold text-foreground truncate">{chapter.title}</h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={(completedCount / totalLessons) * 100} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{completedCount}/{totalLessons}</span>
                    </div>
                  </div>
                  {isLocked && <span className="text-lg">🔒</span>}
                  {completedCount === totalLessons && totalLessons > 0 && <Trophy className="h-5 w-5 text-warning" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <PremiumDialog open={showPremium || showPremiumPopup} onOpenChange={(open) => { setShowPremium(open); setShowPremiumPopup(open); }} />
      <LevelRoadmap open={showRoadmap} onOpenChange={setShowRoadmap} currentLevel={level} xpPerLevel={xpPerLevel} />
      <CouponExpiredDialog open={couponExpired} onOpenChange={(open) => { if (!open) dismissCouponExpired(); }} onSubscribe={startCheckout} onStayFree={dismissCouponExpired} />
      <LevelUpDialog open={showLevelUp} onOpenChange={setShowLevelUp} levelInfo={levelInfo} newLevel={level} />
      <StreakDialog open={showStreak} onOpenChange={setShowStreak} streak={progress.streak} bestStreak={Math.max(bestStreak, progress.streak)} lastActivityDate={progress.lastActivityDate} />
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
