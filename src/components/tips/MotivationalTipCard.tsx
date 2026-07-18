import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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
  durationMs = 2000,
}: Props) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <motion.div
      initial={{ y: -60, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -60, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed left-1/2 -translate-x-1/2 top-[calc(var(--sat)+72px)] z-50 w-[92%] max-w-md pointer-events-none"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${gradientClass} p-4 shadow-2xl`}
      >
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

        <div className="relative flex items-center gap-3">
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
