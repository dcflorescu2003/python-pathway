import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { School, Search, Sparkles, ArrowRight, PartyPopper, GraduationCap, BookOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { schools, setSelectedSchool } from "@/data/schools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import onboardingImg from "@/assets/onboarding-school.png";
import { toast } from "sonner";

interface SchoolOnboardingProps {
  onComplete: () => void;
}

// ─── Confetti Canvas ───────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rotation: number;
  rotationSpeed: number; opacity: number;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))", "hsl(45 100% 55%)", "hsl(210 100% 56%)",
  "hsl(0 80% 55%)", "hsl(140 60% 50%)", "hsl(280 70% 60%)",
];

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animRef = useRef<number>();

  const spawn = useCallback(() => {
    const p: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      p.push({
        x: Math.random() * window.innerWidth, y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6, vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10, opacity: 1,
      });
    }
    particles.current = p;
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    spawn();
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.opacity > 0.01);
      for (const p of particles.current) {
        p.x += p.vx; p.vy += 0.08; p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height - 50) p.opacity *= 0.96;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active, spawn]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── Floating emojis background ────────────────────────────
const floatingEmojis = ["🐍", "💻", "🎓", "⚡", "🏫", "🏆", "📚", "🎯"];

function FloatingEmojis() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {floatingEmojis.map((emoji, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl opacity-10"
          initial={{ x: `${10 + (i * 12) % 90}%`, y: `${20 + (i * 17) % 70}%` }}
          animate={{
            y: [`${20 + (i * 17) % 70}%`, `${15 + (i * 13) % 60}%`, `${20 + (i * 17) % 70}%`],
            rotate: [0, 15, -10, 0],
          }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Step 1: Welcome ───────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -60 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      className="w-full max-w-md flex flex-col items-center text-center"
    >
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}>
        <motion.img
          src={onboardingImg} alt="Python la școală"
          className="w-48 h-48 object-contain mb-6 drop-shadow-lg"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.h1 className="text-3xl font-bold text-foreground mb-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        Bine ai venit în{" "}
        <span className="text-gradient-primary">Py</span>
        <span className="text-tricolor">Ro</span>! 🐍
      </motion.h1>
      <motion.p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        Învață Python pas cu pas, rezolvă exerciții și urcă în clasament alături de colegi.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full">
        <Button onClick={onNext} className="w-full h-14 text-lg font-semibold rounded-2xl gap-2 group">
          Să începem
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>
      <motion.div className="flex gap-2 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
      </motion.div>
    </motion.div>
  );
}

// ─── Step 2: Role Selection ────────────────────────────────
function RoleSelectionStep({ onSelect }: { onSelect: (role: "student" | "teacher") => void }) {
  const [selected, setSelected] = useState<"student" | "teacher" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    if (selected === "teacher") {
      try {
        await supabase.rpc("request_teacher_status");
      } catch (err: any) {
        toast.error(err.message || "Eroare la activarea modului profesor.");
        setLoading(false);
        return;
      }
    }
    onSelect(selected);
    setLoading(false);
  };

  const roles = [
    {
      id: "student" as const,
      icon: BookOpen,
      title: "Sunt Elev",
      emoji: "🎒",
      description: "Te poți alătura unei clase, poți concura cu colegii de liceu și poți primi provocări de la profesori.",
    },
    {
      id: "teacher" as const,
      icon: GraduationCap,
      title: "Sunt Profesor",
      emoji: "👨‍🏫",
      description: "Poți crea clase, da provocări și crea teste. Pentru a folosi baza de teste a aplicației, trebuie să-ți confirmi contul de profesor.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 60 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -60 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      className="w-full max-w-md flex flex-col items-center text-center"
    >
      <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Users className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Cine ești?</h2>
        <p className="text-muted-foreground text-sm">Alege rolul tău pentru a personaliza experiența.</p>
      </motion.div>

      <div className="w-full space-y-3 mb-6">
        {roles.map((role, i) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                  : "border-border bg-card hover:border-primary/30 hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary/15" : "bg-secondary"
                }`}>
                  <span className="text-xl">{role.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {role.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full">
        <Button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full h-12 text-base font-semibold rounded-xl gap-2"
        >
          {loading ? "Se salvează..." : "Continuă"}
          {!loading && <ArrowRight className="h-5 w-5" />}
        </Button>
      </motion.div>

      <motion.div className="flex gap-2 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
      </motion.div>
    </motion.div>
  );
}

// ─── Step 3: School Picker ─────────────────────────────────
function SchoolPickerStep({ onComplete, user }: { onComplete: () => void; user: { id: string } | null }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const filtered = search.trim()
    ? schools.filter((s) => `${s.name} ${s.city}`.toLowerCase().includes(search.toLowerCase())).slice(0, 40)
    : schools.slice(0, 40);

  const selectedSchool = schools.find((s) => s.id === selectedId);

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (selectedId) {
        setSelectedSchool(selectedId);
        await supabase.from("profiles").update({ school_id: selectedId }).eq("user_id", user.id);
      } else {
        await supabase.from("profiles").update({ school_id: "skipped" }).eq("user_id", user.id);
      }
    } catch (e) {
      console.error("Failed to save school:", e);
    }
    setShowConfetti(true);
    setTimeout(() => onComplete(), 1200);
  };

  return (
    <>
      <ConfettiCanvas active={showConfetti} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 60 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <motion.div className="text-center mb-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <GraduationCap className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Alege liceul tău</h2>
          <p className="text-muted-foreground text-sm">Concurează cu colegii și urcă în clasamentul școlii!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full rounded-2xl border border-border bg-card overflow-hidden mb-4 shadow-lg"
        >
          <div className="p-3 border-b border-border flex items-center gap-2 bg-secondary/30">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Caută liceul tău..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((school, i) => (
                <motion.button
                  key={school.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * Math.min(i, 15) }}
                  onClick={() => setSelectedId(school.id === selectedId ? null : school.id)}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-0 transition-all duration-200 ${
                    selectedId === school.id
                      ? "bg-primary/10 text-primary font-semibold scale-[1.01]"
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <School className={`h-4 w-4 shrink-0 transition-colors ${selectedId === school.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="truncate">
                      {school.name} <span className="text-muted-foreground">— {school.city}</span>
                    </span>
                  </span>
                </motion.button>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-muted-foreground text-center">Niciun liceu găsit. Încearcă alt termen.</p>
            )}
            {!search.trim() && schools.length > 40 && (
              <p className="px-4 py-2 text-xs text-muted-foreground text-center">Caută pentru a vedea mai multe...</p>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedSchool && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 text-sm text-primary font-medium"
            >
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5 }}>
                <Sparkles className="h-4 w-4" />
              </motion.div>
              {selectedSchool.name}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full space-y-2">
          <Button onClick={handleContinue} disabled={saving} className="w-full h-12 text-base font-semibold rounded-xl gap-2 group relative overflow-hidden">
            {saving ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>Se salvează...</motion.span>
            ) : selectedId ? (
              <><PartyPopper className="h-5 w-5" /> Hai la treabă!</>
            ) : "Continuă fără liceu"}
          </Button>
          {!selectedId && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground text-center">
              Poți alege oricând mai târziu din pagina principală.
            </motion.p>
          )}
        </motion.div>

        <motion.div className="flex gap-2 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Main Onboarding ──────────────────────────────────────
const SchoolOnboarding = ({ onComplete }: SchoolOnboardingProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [skipRoleStep, setSkipRoleStep] = useState(false);

  // Check if user already has teacher_status set (re-login) — skip role step
  useEffect(() => {
    if (!user) return;
    const checkStatus = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("teacher_status")
        .eq("user_id", user.id)
        .single();
      if (data?.teacher_status) {
        setSkipRoleStep(true);
      }
    };
    checkStatus();
  }, [user]);

  const handleRoleSelected = (_role: "student" | "teacher") => {
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <FloatingEmojis />
      <div className="relative z-10 w-full flex justify-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <WelcomeStep key="welcome" onNext={() => setStep(skipRoleStep ? 2 : 1)} />
          )}
          {step === 1 && (
            <RoleSelectionStep key="role" onSelect={handleRoleSelected} />
          )}
          {step === 2 && (
            <SchoolPickerStep key="school" onComplete={onComplete} user={user} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SchoolOnboarding;
