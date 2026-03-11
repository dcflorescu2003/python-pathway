import { useState } from "react";
import { useProgress } from "@/hooks/useProgress";
import { schools, getSelectedSchool } from "@/data/schools";
import { Flame, Zap, Medal } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_SCHOOLS = ["lic1", "lic2", "lic3", "lic1", "lic2", "lic1", "lic3", "lic2", "lic1", "lic3"];

const MOCK_LEADERBOARD = [
  { name: "Alex P.", xp: 1250, streak: 14, avatar: "🧑‍💻", schoolId: MOCK_SCHOOLS[0] },
  { name: "Maria D.", xp: 980, streak: 9, avatar: "👩‍💻", schoolId: MOCK_SCHOOLS[1] },
  { name: "Andrei R.", xp: 870, streak: 7, avatar: "🧑‍🎓", schoolId: MOCK_SCHOOLS[2] },
  { name: "Elena S.", xp: 750, streak: 12, avatar: "👩‍🎓", schoolId: MOCK_SCHOOLS[3] },
  { name: "Mihai C.", xp: 620, streak: 5, avatar: "🎮", schoolId: MOCK_SCHOOLS[4] },
  { name: "Ioana B.", xp: 510, streak: 3, avatar: "📚", schoolId: MOCK_SCHOOLS[5] },
  { name: "Vlad T.", xp: 440, streak: 6, avatar: "🐍", schoolId: MOCK_SCHOOLS[6] },
  { name: "Ana M.", xp: 380, streak: 2, avatar: "⭐", schoolId: MOCK_SCHOOLS[7] },
  { name: "Cristian L.", xp: 290, streak: 4, avatar: "🚀", schoolId: MOCK_SCHOOLS[8] },
  { name: "Daria F.", xp: 150, streak: 1, avatar: "💡", schoolId: MOCK_SCHOOLS[9] },
];

const medalColors = [
  "text-yellow-400",
  "text-gray-300",
  "text-amber-600",
];

type Tab = "national" | "school";

const LeaderboardPage = () => {
  const { progress } = useProgress();
  const [tab, setTab] = useState<Tab>("national");
  const userSchool = getSelectedSchool();

  const userEntry = { name: "Tu", xp: progress.xp, streak: progress.streak, avatar: "🐍", schoolId: userSchool || "" };
  
  const allEntries = [...MOCK_LEADERBOARD, userEntry]
    .sort((a, b) => b.xp - a.xp);

  const filteredEntries = tab === "school" && userSchool
    ? allEntries.filter((e) => e.schoolId === userSchool).slice(0, 15)
    : allEntries.slice(0, 15);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">🏆</span>
          <h1 className="text-lg font-bold text-foreground">Clasament</h1>
        </div>
        {/* Tabs */}
        <div className="flex px-4 pb-2 gap-2">
          <button
            onClick={() => setTab("national")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "national"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            🌍 Național
          </button>
          <button
            onClick={() => setTab("school")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "school"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            🏫 Liceu
          </button>
        </div>
      </header>

      <main className="px-4 py-4">
        {tab === "school" && !userSchool && (
          <div className="rounded-xl border border-border bg-card p-4 text-center mb-4">
            <p className="text-sm text-foreground/70">
              Alege liceul tău de pe pagina principală pentru a vedea clasamentul pe liceu.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filteredEntries.map((entry, idx) => {
            const isUser = entry.name === "Tu";
            return (
              <motion.div
                key={`${entry.name}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-3 rounded-xl border p-3 active:scale-[0.98] transition-all ${
                  isUser
                    ? "border-primary bg-primary/10 glow-primary"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {idx < 3 ? (
                    <Medal className={`h-5 w-5 ${medalColors[idx]}`} />
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground font-bold">
                      {idx + 1}
                    </span>
                  )}
                </div>

                <span className="text-xl">{entry.avatar}</span>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isUser ? "text-primary" : "text-foreground"}`}>
                    {entry.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Zap className="h-3 w-3 text-xp" />
                      {entry.xp} XP
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Flame className="h-3 w-3 text-warning" />
                      {entry.streak}d
                    </span>
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-secondary px-2.5 py-1">
                  <span className="text-xs font-mono font-bold text-xp">{entry.xp}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          🔒 Clasamentul real va fi disponibil după activarea conturilor
        </p>
      </main>
    </div>
  );
};

export default LeaderboardPage;
