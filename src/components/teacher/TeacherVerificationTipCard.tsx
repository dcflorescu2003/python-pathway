import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap, X, ArrowRight, Clock, AlertTriangle, MessageSquare, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { TeacherVerificationDetails } from "@/hooks/useTeacherVerificationTip";

interface Props {
  onDismiss: () => void;
  durationMs?: number;
  details?: TeacherVerificationDetails | null;
}

const defaultSteps = [
  "Deschide Cont → secțiunea Profesor",
  "Alege o metodă de validare (email de școală, adeverință, cod coleg)",
  "Trimite dovada — răspundem rapid în chatul de verificare",
];

const TeacherVerificationTipCard = ({ onDismiss, durationMs = 8000, details }: Props) => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const start = Date.now();
    const duration = Math.max(durationMs, 5000);
    let raf = 0;

    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const t = setTimeout(onDismiss, duration);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [onDismiss, durationMs]);

  const config = useMemo(() => {
    const status = details?.requestStatus ?? (details?.profileStatus === "unverified" ? "unverified" : null);

    switch (status) {
      case "pending":
        return {
          icon: Clock,
          title: "Cererea ta este în așteptare ⏳",
          reason: `Ai trimis o cerere prin ${details?.method || "document"}. Administratorul o revizuiește și vei fi notificat când este aprobată.`,
          steps: [
            "Răspunde în chat dacă ți se cer informații suplimentare.",
            "Așteaptă notificarea de aprobare.",
          ],
          cta: "Vezi conversația",
          ctaIcon: MessageSquare,
          action: () => navigate("/auth?tab=profile"),
        };
      case "rejected":
        return {
          icon: AlertTriangle,
          title: "Cererea a fost respinsă ⚠️",
          reason: details?.adminNotes?.trim()
            ? details.adminNotes.trim()
            : "Cererea ta nu a putut fi verificată. Verifică datele trimise și încearcă din nou.",
          steps: [
            "Corectează problema indicată mai sus.",
            "Retrimite o nouă cerere din pagina de cont.",
          ],
          cta: "Retrimite cererea",
          ctaIcon: RefreshCw,
          action: () => navigate("/auth?tab=profile"),
        };
      case "unverified":
      default:
        return {
          icon: GraduationCap,
          title: "Verifică-ți contul de profesor 🎓",
          reason: "Nu ai trimis încă o cerere de verificare. Finalizează procesul pentru a debloca toate funcțiile pentru profesori.",
          steps: defaultSteps,
          cta: "Verifică acum",
          ctaIcon: ArrowRight,
          action: () => navigate("/auth?tab=profile"),
        };
    }
  }, [details, navigate]);

  const Icon = config.icon;
  const CtaIcon = config.ctaIcon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary via-primary to-accent p-4 shadow-2xl w-full max-w-md pointer-events-auto">
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <motion.div className="h-full bg-white/80" style={{ width: `${progress * 100}%` }} />
        </div>

        <button
          onClick={onDismiss}
          aria-label="Închide"
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-3 pr-6">
          <motion.div
            className="shrink-0 rounded-xl bg-white/15 p-2 text-white"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="h-7 w-7" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight mb-1 drop-shadow">
              {config.title}
            </p>
            <p className="text-white/90 text-xs leading-snug mb-2">
              {config.reason}
            </p>
            <ul className="space-y-1 mb-3">
              {config.steps.map((s, i) => (
                <li key={i} className="text-white/90 text-xs leading-snug flex gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                onDismiss();
                config.action();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 transition-colors"
            >
              {config.cta} <CtaIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeacherVerificationTipCard;
