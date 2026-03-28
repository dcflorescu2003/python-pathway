import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getSelectedSchool, schools } from "@/data/schools";
import { Flame, Zap, Medal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const medalColors = [
  "text-yellow-400",
  "text-gray-300",
  "text-amber-600",
];

type Tab = "national" | "school" | "city";

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  xp: number;
  streak: number;
  avatar_url: string | null;
  school_id: string | null;
}

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("national");
  const userSchool = getSelectedSchool();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp, streak, avatar_url, school_id")
        .order("xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
  });

  const userCity = userSchool ? schools.find(s => s.id === userSchool)?.city : null;
  const citySchoolIds = userCity ? schools.filter(s => s.city === userCity).map(s => s.id) : [];

  const filteredEntries = (() => {
    if (tab === "school" && userSchool) {
      return entries.filter((e) => e.school_id === userSchool).slice(0, 15);
    }
    if (tab === "city" && citySchoolIds.length > 0) {
      return entries.filter((e) => e.school_id && citySchoolIds.includes(e.school_id)).slice(0, 15);
    }
    return entries.slice(0, 15);
  })();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">🏆</span>
          <h1 className="text-lg font-bold text-foreground">Clasament</h1>
        </div>
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
            onClick={() => setTab("city")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "city"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            🏙️ Oraș
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
        {(tab === "school" || tab === "city") && !userSchool && (
          <div className="rounded-xl border border-border bg-card p-4 text-center mb-4">
            <p className="text-sm text-foreground/70">
              Alege liceul tău de pe pagina principală pentru a vedea clasamentul pe {tab === "city" ? "oraș" : "liceu"}.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map((entry, idx) => {
              const isUser = entry.user_id === user?.id;
              const displayName = entry.display_name || "Anonim";
              return (
                <motion.div
                  key={entry.user_id}
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

                  <span className="text-xl">{entry.avatar_url || "🐍"}</span>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isUser ? "text-primary" : "text-foreground"}`}>
                      {isUser ? "Tu" : displayName}
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

            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Niciun utilizator încă.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaderboardPage;
