import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface Props {
  icon: string;
  title: string;
  message: string;
  gradientClass: string; // e.g. "from-primary to-accent"
  onDismiss: () => void;
  durationMs?: number;
}

const MotivationalTipCard = ({
  icon,
  title,
  message,
  gradientClass,
  onDismiss,
  durationMs = 5000,
}: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = Math.max(durationMs, 5000);
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    const t = setTimeout(onDismiss, duration);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [onDismiss, durationMs]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${gradientClass} p-4 shadow-2xl w-full max-w-md pointer-events-auto`}
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <motion.div
            className="h-full bg-white/80"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          aria-label="Închide"
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors pointer-events-auto"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Sparkle overlay */}
        <motion.div
          className="absolute -top-4 -right-4 text-white/40"
          animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-16 w-16" />
        </motion.div>
        <motion.div
          className="absolute -bottom-6 -left-6 text-white/20"
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="h-20 w-20" />
        </motion.div>

        <div className="relative flex items-center gap-3 pr-6">
          <motion.div
            className="text-4xl shrink-0"
            animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight mb-0.5 drop-shadow">
              {title}
            </p>
            <p className="text-white/90 text-xs leading-snug drop-shadow">
              {message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MotivationalTipCard;
