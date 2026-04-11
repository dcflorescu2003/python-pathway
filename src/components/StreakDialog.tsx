import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flame, Calendar, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streak: number;
  bestStreak: number;
  lastActivityDate: string;
}

const StreakDialog = ({ open, onOpenChange, streak, bestStreak, lastActivityDate }: StreakDialogProps) => {
  const today = new Date().toISOString().split("T")[0];
  const isActiveToday = lastActivityDate === today;

  const stats = [
    {
      icon: Flame,
      label: "Serie curentă",
      value: `${streak} ${streak === 1 ? "zi" : "zile"}`,
      color: streak > 0 ? "text-orange-500" : "text-muted-foreground",
      bgColor: streak > 0 ? "bg-orange-500/10" : "bg-muted/50",
    },
    {
      icon: Trophy,
      label: "Cel mai lung streak",
      value: `${bestStreak} ${bestStreak === 1 ? "zi" : "zile"}`,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Calendar,
      label: "Activ azi",
      value: isActiveToday ? "Da ✅" : "Nu încă",
      color: isActiveToday ? "text-green-500" : "text-muted-foreground",
      bgColor: isActiveToday ? "bg-green-500/10" : "bg-muted/50",
    },
    {
      icon: TrendingUp,
      label: "Status",
      value: streak > 0 ? (isActiveToday ? "Streak activ 🔥" : "Streak în pericol ⚠️") : "Fără streak",
      color: streak > 0 ? (isActiveToday ? "text-green-500" : "text-orange-400") : "text-muted-foreground",
      bgColor: streak > 0 ? (isActiveToday ? "bg-green-500/10" : "bg-orange-400/10") : "bg-muted/50",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-xl">
            <Flame className="h-6 w-6 text-orange-500" />
            Seria ta zilnică
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center my-2">
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <Flame className={`h-16 w-16 ${streak > 0 ? "text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]" : "text-muted-foreground"}`} />
            <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white drop-shadow-md mt-1">
              {streak}
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-3 ${stat.bgColor}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {!isActiveToday && streak > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Completează un exercițiu azi pentru a-ți păstra seria! 💪
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StreakDialog;
