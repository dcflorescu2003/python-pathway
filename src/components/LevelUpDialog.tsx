import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { LevelInfo } from "@/data/levels";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface LevelUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelInfo: LevelInfo;
  newLevel: number;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#A78BFA",
  "#F59E0B",
];

const LevelUpDialog = ({ open, onOpenChange, levelInfo, newLevel }: LevelUpDialogProps) => {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-xs rounded-2xl border-primary/30 bg-card p-0 overflow-hidden">
            {/* Particle burst background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0.5],
                    x: Math.cos((i / 20) * Math.PI * 2) * (80 + Math.random() * 60),
                    y: Math.sin((i / 20) * Math.PI * 2) * (80 + Math.random() * 60),
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                />
              ))}
            </div>

            <div className="relative flex flex-col items-center px-6 py-8 text-center">
              {/* Glow ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 140,
                  height: 140,
                  top: 24,
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Avatar image */}
              <motion.img
                src={levelInfo.image}
                alt={levelInfo.name}
                className="relative z-10 rounded-full object-cover border-4 border-primary/40 shadow-lg"
                style={{ width: 120, height: 120 }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              />

              {/* Level up text */}
              <motion.div
                className="mt-5 space-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-1 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Level Up!</span>
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-2xl font-extrabold text-foreground">Nivel {newLevel}</p>
                <p className="text-lg font-semibold text-primary">{levelInfo.name}</p>
              </motion.div>

              {/* Stars animation */}
              <motion.div
                className="flex gap-1 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="text-xl"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 300 }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-5 w-full"
              >
                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full rounded-xl font-bold"
                  size="lg"
                >
                  Continuă 🚀
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default LevelUpDialog;
