import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const MESSAGES = [
  "Continuă tot așa! 💪",
  "Ești de neoprit! 🚀",
  "Disciplina face diferența! ⭐",
  "Fiecare zi contează! 🎯",
  "Superb! Nu te opri! 🏆",
];

interface StreakCelebrationDialogProps {
  streakCount: number;
  open: boolean;
  onClose: () => void;
}

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ["#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#a855f7"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ width: 6, height: 6, backgroundColor: color, left: `${x}%`, top: "40%" }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: [0, -80, 60], x: [0, (Math.random() - 0.5) * 120], scale: [1, 1.2, 0.5], rotate: [0, 360] }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
    />
  );
}

const StreakCelebrationDialog = ({ streakCount, open, onClose }: StreakCelebrationDialogProps) => {
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-xs mx-4 rounded-2xl border border-border bg-card p-8 text-center overflow-hidden"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti */}
            {Array.from({ length: 16 }).map((_, i) => (
              <ConfettiParticle key={i} delay={0.1 + i * 0.05} x={10 + (i * 5)} />
            ))}

            {/* Glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ background: "radial-gradient(circle at center 40%, hsl(var(--primary) / 0.15), transparent 70%)" }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Fire icon */}
            <motion.div
              className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, hsl(25 95% 53% / 0.4), transparent)" }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <Flame className="h-12 w-12 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
            </motion.div>

            {/* Streak count */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.2, damping: 10, stiffness: 200 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-1">
                🔥 Serie de {streakCount} {streakCount === 1 ? "zi" : "zile"}!
              </h2>
            </motion.div>

            <motion.p
              className="text-sm text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>

            <Button onClick={onClose} className="w-full h-12 text-base font-bold">
              Continuă
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebrationDialog;
