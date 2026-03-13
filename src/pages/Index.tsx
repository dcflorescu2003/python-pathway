import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getLevelFromXP, getXPForNextLevel } from "@/data/courses";
import { getStoredChapters } from "@/hooks/useExerciseStore";
import { useProgress } from "@/hooks/useProgress";
import { schools, getSelectedSchool, setSelectedSchool, clearSelectedSchool } from "@/data/schools";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Flame, Heart, Zap, Trophy, Crown, School, ChevronDown, Plus, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PremiumDialog from "@/components/PremiumDialog";
import InstallDialog from "@/components/InstallDialog";
import SchoolOnboarding from "@/components/onboarding/SchoolOnboarding";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { supabase } from "@/integrations/supabase/client";

const Index = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { progress } = useProgress();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [selectedSchool, setSchool] = useState(getSelectedSchool());
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [showPremium, setShowPremium] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

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

  if (needsOnboarding === true) {
    return <SchoolOnboarding onComplete={() => {
      setNeedsOnboarding(false);
      setSchool(getSelectedSchool());
    }} />;
  }

  const chapters = getStoredChapters();
  const level = getLevelFromXP(progress.xp);
  const xpToNext = getXPForNextLevel(progress.xp);
  const xpInLevel = 100 - xpToNext;

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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold font-mono">🐍 <span className="text-gradient-primary">Py</span><span className="text-tricolor">Ro</span></h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowPremium(true)} className="text-yellow-500 active:scale-95 transition-transform">
              <Crown className="h-5 w-5" />
            </button>
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
        {/* School selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <Input
                  placeholder="Caută liceu sau oraș..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>
              {filteredSchools.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {filteredSchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => handleSelectSchool(school.id)}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-0 transition-colors ${
                        selectedSchool === school.id ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary"
                      }`}
                    >
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
                <button
                  onClick={handleRemoveSchool}
                  className="w-full text-left px-4 py-3 text-sm text-destructive border-t border-border"
                >
                  Elimină selecția
                </button>
              )}

              {!showAddSchool ? (
                <button
                  onClick={() => setShowAddSchool(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary border-t border-border"
                >
                  <Plus className="h-4 w-4" />
                  Adaugă liceul tău
                </button>
              ) : (
                <div className="p-3 border-t border-border space-y-2">
                  <Input
                    placeholder="Numele liceului..."
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddSchool(false)} className="flex-1">
                      Anulează
                    </Button>
                    <Button size="sm" onClick={handleAddSchool} disabled={!newSchoolName.trim()} className="flex-1">
                      Trimite cererea
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-xl border border-border bg-card p-5 glow-primary"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Nivel {level}</p>
              <p className="text-lg font-bold text-foreground">
                Pythonist {progress.isPremium && <span className="text-yellow-500">👑</span>}
              </p>
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
            // Exclude practice lessons from unlock calculation
            const nonPracticeLessons = chapter.lessons.filter(
              (l) => !l.title.startsWith("Practică:")
            );
            const completedCount = chapter.lessons.filter(
              (l) => progress.completedLessons[l.id]?.completed
            ).length;
            const totalLessons = chapter.lessons.length;
            
            const isLocked = idx > 0 && (() => {
              const prevChapter = chapters[idx - 1];
              const prevNonPractice = prevChapter.lessons.filter(
                (l) => !l.title.startsWith("Practică:")
              );
              const prevCompleted = prevNonPractice.filter(
                (l) => progress.completedLessons[l.id]?.completed
              ).length;
              return prevCompleted < Math.ceil(prevNonPractice.length * 0.5);
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
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Capitol {chapter.number}
                    </p>
                    <h2 className="text-base font-bold text-foreground truncate">
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

      <PremiumDialog open={showPremium} onOpenChange={setShowPremium} />
    </div>
  );
};

export default Index;
