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
import { motion } from "framer-motion";
import { Flame, Heart, Zap, Trophy, Crown, School, ChevronDown, Plus, Target, BookOpen, Code } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PremiumDialog from "@/components/PremiumDialog";
import LevelRoadmap from "@/components/LevelRoadmap";
import InstallDialog from "@/components/InstallDialog";
import SchoolOnboarding from "@/components/onboarding/SchoolOnboarding";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useSubscription } from "@/hooks/useSubscription";
import CouponExpiredDialog from "@/components/CouponExpiredDialog";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/states/LoadingScreen";
import LevelUpDialog from "@/components/LevelUpDialog";
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
  const [showInstall, setShowInstall] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const { isInstalled, canPrompt, promptInstall } = useInstallPrompt();
  const { couponExpired, dismissCouponExpired, startCheckout } = useSubscription();
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

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
  const showInstallCta = !Capacitor.isNativePlatform() && !isInstalled && !progress.isPremium;

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

  if (chaptersLoading || !chapters) return <LoadingScreen />;

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
    <div className="min-h-screen bg-background">
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
            {!progress.isPremium && (
              <button onClick={() => setShowPremium(true)} className="text-yellow-500 active:scale-95 transition-transform">
                <Crown className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-1 text-warning">
              <Flame className="h-5 w-5" />
              <span className="text-sm font-bold">{progress.streak}</span>
            </div>
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
        {showInstallCta && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Button
              onClick={async () => {
                if (canPrompt) { await promptInstall(); } else { setShowInstall(true); }
              }}
              className="w-full py-6 text-lg font-bold rounded-xl gap-2"
              size="lg"
            >
              📲 Instalează și ai Premium gratuit!
            </Button>
          </motion.div>
        )}

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

      <PremiumDialog open={showPremium} onOpenChange={setShowPremium} />
      <InstallDialog open={showInstall} onOpenChange={setShowInstall} />
      <LevelRoadmap open={showRoadmap} onOpenChange={setShowRoadmap} currentLevel={level} xpPerLevel={xpPerLevel} />
      <CouponExpiredDialog open={couponExpired} onOpenChange={(open) => { if (!open) dismissCouponExpired(); }} onSubscribe={startCheckout} onStayFree={dismissCouponExpired} />
      <LevelUpDialog open={showLevelUp} onOpenChange={setShowLevelUp} levelInfo={levelInfo} newLevel={level} />
    </div>
  );
};

export default Index;
