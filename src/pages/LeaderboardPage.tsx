import { useNavigate } from "react-router-dom";
import { useProgress } from "@/hooks/useProgress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Flame, Zap, Medal } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_LEADERBOARD = [
  { name: "Alex P.", xp: 1250, streak: 14, avatar: "🧑‍💻" },
  { name: "Maria D.", xp: 980, streak: 9, avatar: "👩‍💻" },
  { name: "Andrei R.", xp: 870, streak: 7, avatar: "🧑‍🎓" },
  { name: "Elena S.", xp: 750, streak: 12, avatar: "👩‍🎓" },
  { name: "Mihai C.", xp: 620, streak: 5, avatar: "🎮" },
  { name: "Ioana B.", xp: 510, streak: 3, avatar: "📚" },
  { name: "Vlad T.", xp: 440, streak: 6, avatar: "🐍" },
  { name: "Ana M.", xp: 380, streak: 2, avatar: "⭐" },
  { name: "Cristian L.", xp: 290, streak: 4, avatar: "🚀" },
  { name: "Daria F.", xp: 150, streak: 1, avatar: "💡" },
];

const medalColors = [
  "text-yellow-400",
  "text-gray-300",
  "text-amber-600",
];

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();

  // Insert current user into leaderboard
  const userEntry = { name: "Tu", xp: progress.xp, streak: progress.streak, avatar: "🐍" };
  const allEntries = [...MOCK_LEADERBOARD, userEntry]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 15);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Trophy className="h-5 w-5 text-warning" />
          <h1 className="text-lg font-bold text-foreground">Clasament</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="space-y-2">
          {allEntries.map((entry, idx) => {
            const isUser = entry.name === "Tu";
            return (
              <motion.div
                key={`${entry.name}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                  isUser
                    ? "border-primary bg-primary/10 glow-primary"
                    : "border-border bg-card"
                }`}
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {idx < 3 ? (
                    <Medal className={`h-6 w-6 ${medalColors[idx]}`} />
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground font-bold">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <span className="text-2xl">{entry.avatar}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isUser ? "text-primary" : "text-foreground"}`}>
                    {entry.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-xp" />
                      {entry.xp} XP
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="h-3 w-3 text-warning" />
                      {entry.streak} zile
                    </span>
                  </div>
                </div>

                {/* XP badge */}
                <div className="shrink-0 rounded-full bg-secondary px-3 py-1">
                  <span className="text-sm font-mono font-bold text-xp">{entry.xp}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          🔒 Clasamentul real va fi disponibil după activarea conturilor
        </p>
      </main>
    </div>
  );
};

export default LeaderboardPage;
